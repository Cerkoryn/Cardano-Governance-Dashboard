from http.server import BaseHTTPRequestHandler
import requests
import json
import time
import os

class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        cron_token = os.getenv("CRON_SECRET")
        auth_header = self.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            self.send_response(403)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Forbidden'}).encode('utf-8'))
            return

        request_token = auth_header.split(' ')[1]

        if request_token != cron_token:
            self.send_response(403)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Forbidden'}).encode('utf-8'))
            return

        start_time = time.time()
        mavdata_url = 'https://www.balanceanalytics.io/api/mavdata.json'
        groupdata_url = 'https://www.balanceanalytics.io/api/groupdata.json'
        weird_exceptions = ['WAVE', '1PCT', 'BLOOM']                            # Add new exceptions here for weird pool names that break things.

        mavdata_response = requests.get(mavdata_url)
        mavdata = mavdata_response.json()[0]['mav_data']

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
        
        # Save to Vercel KV using requests
        VERCEL_KV_API_URL = os.getenv("KV_REST_API_URL")
        VERCEL_KV_TOKEN = os.getenv("KV_REST_API_TOKEN")
        url = f"{VERCEL_KV_API_URL}/set/spo_data/{json.dumps(extracted_data)}"
        headers = {
            "Authorization": f"Bearer {VERCEL_KV_TOKEN}",
            "Content-Type": "application/json"
        }

        response = requests.post(url, headers=headers)
        response.raise_for_status()
        
        elapsed_time = time.time() - start_time
        response_body = {
            'status': 'ok',
            'elapsed_time': elapsed_time
        }

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response_body).encode('utf-8'))
        return