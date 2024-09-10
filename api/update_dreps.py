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
        base_url = "https://www.1694.io/api/dreps?s=&page={}"
        page = 1
        all_data = []

        while True:
            attempts = 0
            while attempts < 2:
                try:
                    response = requests.get(base_url.format(page), timeout=3)
                    response.raise_for_status() 
                    break
                except (requests.exceptions.RequestException, requests.exceptions.Timeout) as e:
                    attempts += 1
                    if attempts == 10:
                        self.send_response(500)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'error': 'Failed to fetch data after 2 attempts'}).encode('utf-8'))
                        return
            data = response.json()
            
            dreps = data.get('data', [])
            if not dreps:
                break
            
            for dRep in dreps:

                live_power = dRep.get('live_stake')
                active_power = dRep.get('voting_power')
                if active_power is None:
                    continue
                
                # Check for "NaN" and handle it appropriately
                if live_power is not None and live_power != "NaN":
                    live_power = float(live_power)
                else:
                    live_power = None
                
                if active_power is not None:
                    active_power = float(active_power)
                
                given_name = dRep.get('given_name')
                if given_name is None:
                    url = dRep.get('url')
                    if url:
                        try:
                            response = requests.get(url, timeout=10)
                            response.raise_for_status()
                            given_name = is_valid_jsonld(response)
                        except (requests.exceptions.RequestException, requests.exceptions.Timeout):
                            pass
                
                # Only store the dRep if live_power and active_power are not both None or 0
                if (live_power or 0) != 0 or (active_power or 0) != 0:
                    all_data.append({
                        'drep_id': dRep.get('view'),
                        'live_power': live_power,
                        'active_power': active_power,
                        'given_name': given_name
                    })
            
            if page >= data.get('totalPages', 1):
                break
            page += 1

        all_data.sort(key=lambda x: x['active_power'], reverse=True)
        
        # Save to Vercel KV using requests
        VERCEL_KV_API_URL = os.getenv("KV_REST_API_URL")
        VERCEL_KV_TOKEN = os.getenv("KV_REST_API_TOKEN")
        url = f"{VERCEL_KV_API_URL}/set/drep_data/{json.dumps(all_data)}"
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