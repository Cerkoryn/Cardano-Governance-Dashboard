from http.server import BaseHTTPRequestHandler
import requests
import json
import time
import os

def is_valid_jsonld(response):
    try:
        data = response.json()
        if "@context" in data and "body" in data and "givenName" in data["body"]:
            given_name = data["body"]["givenName"]
            if isinstance(given_name, dict) and "@value" in given_name:
                return given_name["@value"]
            return given_name
    except (ValueError, KeyError):
        return None
    return None

def fetch_drep_list():
    drep_list_url = "https://api.koios.rest/api/v1/drep_list"

    try:
        response = requests.get(drep_list_url, timeout=3)
        response.raise_for_status()
    except (requests.exceptions.RequestException, requests.exceptions.Timeout):
        print({'error': 'Failed to fetch dRep list.'})
        return None
    if response is None:
        print({'error': 'Response is empty.'})
        return None
    
    drep_list_data = response.json()
    return [drep['drep_id'] for drep in drep_list_data if 'drep_id' in drep]

class handler(BaseHTTPRequestHandler):

    def send_json_response(self, status_code, body):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(body).encode('utf-8'))

    def do_GET(self):
        cron_token = os.getenv("CRON_SECRET")
        auth_header = self.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            self.send_json_response(403, {'error': 'Forbidden'})
            return

        request_token = auth_header.split(' ')[1]

        if request_token != cron_token:
            self.send_json_response(403, {'error': 'Forbidden'})
            return

        start_time = time.time()
        drep_list = fetch_drep_list()
        if drep_list is None:
            return

        drep_info_url = "https://api.koios.rest/api/v1/drep_info"

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }


        dreps = []
        for i in range(0, len(drep_list), 50):
            batch_drep_ids = drep_list[i:i+50]
            payload = {
                "_drep_ids": batch_drep_ids
            }
            try:
                response = requests.post(drep_info_url, headers=headers, json=payload, timeout=5)
                response.raise_for_status()
            except (requests.exceptions.RequestException, requests.exceptions.Timeout):
                self.send_json_response(500, {'error': 'Failed to fetch dRep info.'})
                return

            data = response.json()
            if not isinstance(data, list):
                self.send_json_response(500, {'error': 'Unexpected response format.'})
                return
            if data:
                dreps.extend(data)
            else:
                self.send_json_response(500, {'error': 'Response is empty.'})
                return
        
        final_data = []
        for dRep in dreps:
            given_name = None
            active_power = int(dRep.get('amount', 0))
            if active_power is None or active_power <= 0:
                continue
            
            meta_url = dRep.get('meta_url')
            # Lazy way to not have to do a request to everyone's URL.
            # Will probably miss some who host on other places.
            if meta_url and ("ipfs" in meta_url or "github" in meta_url):
                try:
                    response = requests.get(meta_url, timeout=2)
                    response.raise_for_status()
                    given_name = is_valid_jsonld(response)
                except (requests.exceptions.RequestException, requests.exceptions.Timeout):
                    given_name = None
            
            final_data.append({
                'drep_id': dRep.get('drep_id'),
                'is_active': dRep.get('active'),
                'active_power': active_power,
                'given_name': given_name
            })

        final_data.sort(key=lambda x: x['active_power'], reverse=True)
        
        # Save to Vercel KV using requests
        VERCEL_KV_API_URL = os.getenv("KV_REST_API_URL")
        VERCEL_KV_TOKEN = os.getenv("KV_REST_API_TOKEN")
        url = f"{VERCEL_KV_API_URL}/set/drep_data/{json.dumps(final_data)}"
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

        self.send_json_response(200, response_body)
        return