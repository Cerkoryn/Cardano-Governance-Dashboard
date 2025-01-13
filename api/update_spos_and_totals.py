from concurrent.futures import ThreadPoolExecutor, as_completed
from http.server import BaseHTTPRequestHandler, HTTPServer
import requests
import json
import time
import os

class handler(BaseHTTPRequestHandler):

    def authenticate_request(self):
        cron_token = os.getenv("CRON_SECRET")
        auth_header = self.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            self.send_json_response(403, {'error': 'Forbidden'})
            return False

        request_token = auth_header.split(' ')[1]

        if request_token != cron_token:
            self.send_json_response(403, {'error': 'Forbidden'})
            return False

        return True
    
    def send_json_response(self, status_code, body):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(body).encode('utf-8'))

    def do_GET(self):
        if not self.authenticate_request():
            return

        start_time = time.time()

        try:
            # Update SPO Data
            groupdata = self.update_spo_data()

            # Update Totals
            self.update_totals(groupdata)

            elapsed_time = time.time() - start_time
            response_body = {
                'status': 'ok',
                'elapsed_time': elapsed_time
            }

            self.send_json_response(200, response_body)
            return

        except Exception as e:
            error_message = {'error': 'Internal Server Error', 'details': str(e)}
            self.send_json_response(500, error_message)
            return

    def update_spo_data(self):

        mavdata_url = 'https://www.balanceanalytics.io/api/mavdata.json'
        groupdata_url = 'https://www.balanceanalytics.io/api/groupdata.json'
        weird_exceptions = ['WAVE', '1PCT', 'BLOOM']  # Add new exceptions here for weird pool names that break things.

        mavdata_response = requests.get(mavdata_url)
        mavdata = mavdata_response.json()['api_data']

        groupdata_response = requests.get(groupdata_url)
        groupdata = groupdata_response.json()[0]['pool_group_json']

        singlepool_stake = 0
        extracted_data = []

        for entry in mavdata:
            label = entry['label']
            stake = entry['stake']
            
            # Check if the label corresponds to a pool_ticker in groupdata with SINGLEPOOL as pool_group
            is_singlepool = False
            for group in groupdata:
                if group['pool_ticker'] == label and group['pool_group'] == 'SINGLEPOOL':
                    if label in weird_exceptions:                                  
                        is_singlepool = False
                        break
                    is_singlepool = True
                    break
            
            if is_singlepool:
                singlepool_stake += stake
            else:
                extracted_data.append({'label': label, 'stake': stake})

        # Add the combined SINGLEPOOL entry if there was any matching pool
        if singlepool_stake > 0:
            extracted_data.append({'label': 'SINGLEPOOL', 'stake': singlepool_stake})

        extracted_data.sort(key=lambda x: x['stake'], reverse=True)
        
        # Save SPO Data to Vercel KV
        VERCEL_KV_API_URL = os.getenv("KV_REST_API_URL")
        VERCEL_KV_TOKEN = os.getenv("KV_REST_API_TOKEN")
        spo_url = f"{VERCEL_KV_API_URL}/set/spo_data/{json.dumps(extracted_data)}"
        spo_headers = {
            "Authorization": f"Bearer {VERCEL_KV_TOKEN}",
            "Content-Type": "application/json"
        }

        spo_response = requests.post(spo_url, headers=spo_headers)
        spo_response.raise_for_status()
        return groupdata

    def update_totals(self, groupdata):

        circulating_ada_url = "https://api.koios.rest/api/v1/totals"
        ada_response = requests.get(circulating_ada_url)
        ada_response.raise_for_status()
        ada_data = ada_response.json()

        # Find the entry with the largest epoch_no
        latest_epoch = max(ada_data, key=lambda x: x['epoch_no'])
        ada_supply = (int(latest_epoch['supply']) / 1000000)

        pool_list_url = "https://api.koios.rest/api/v1/pool_list"
        offset = 0
        limit = 500
        pool_list = []

        while True:
            paginated_url = f"{pool_list_url}?offset={offset}&limit={limit}"
            pool_list_response = requests.get(paginated_url)
            pool_list_response.raise_for_status()
            pool_list_data = pool_list_response.json()
            
            if not pool_list_data:
                break
            
            for pool in pool_list_data:
                if pool.get('pool_status') != 'retired':
                    pool_list.append(pool['pool_id_bech32'])
                else:
                    groupdata[:] = [group for group in groupdata if group.get('pool_hash') != pool['pool_id_bech32']]
            offset += limit

        pool_info_url = "https://api.koios.rest/api/v1/pool_info"
        total_pool_delegators = 0

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

        def fetch_pool_info(batch_pool_ids):
            payload = {
                "_pool_bech32_ids": batch_pool_ids
            }
            try:
                response = requests.post(pool_info_url, headers=headers, json=payload, timeout=15)
                response.raise_for_status()
                return response.json()
            except (requests.exceptions.RequestException, requests.exceptions.Timeout) as e:
                print({'error': 'Failed to fetch pool info.'})
                print(e)
                return []

        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = {executor.submit(fetch_pool_info, pool_list[i:i+50]): i for i in range(0, len(pool_list), 50)}
            for future in as_completed(futures):
                pool_info_data = future.result()
                for pool in pool_info_data:
                    total_pool_delegators += pool.get('live_delegators', 0)

        unique_groups = set()
        singlepool_count = 0
        for group in groupdata:
            if group['pool_group'] == 'SINGLEPOOL':
                singlepool_count += 1
            else:
                unique_groups.add(group['pool_group'])
        total_spos = len(unique_groups) + singlepool_count

        total_data = {
            'total_spos': total_spos,
            'total_pools': len(pool_list),
            'total_pool_delegators': total_pool_delegators,
            'circulating_ada': ada_supply
        }

        # Save Circulating ADA Data to Vercel KV
        VERCEL_KV_API_URL = os.getenv("KV_REST_API_URL")
        VERCEL_KV_TOKEN = os.getenv("KV_REST_API_TOKEN")
        ada_url = f"{VERCEL_KV_API_URL}/set/totals/{json.dumps(total_data)}"
        ada_headers = {
            "Authorization": f"Bearer {VERCEL_KV_TOKEN}",
            "Content-Type": "application/json"
        }

        ada_save_response = requests.post(ada_url, headers=ada_headers)
        ada_save_response.raise_for_status()

def run(server_class=HTTPServer, handler_class=handler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting httpd on port {port}...')
    httpd.serve_forever()

if __name__ == "__main__":
    run()