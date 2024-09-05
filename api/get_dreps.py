from http.server import BaseHTTPRequestHandler
import requests
import json
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
        base_url = "https://www.1694.io/api/dreps?s=&page={}"
        page = 1
        all_data = []

        while True:
            attempts = 0
            while attempts < 10:
                try:
                    response = requests.get(base_url.format(page), timeout=30)
                    response.raise_for_status()  # Raise an exception for HTTP errors
                    break
                except (requests.exceptions.RequestException, requests.exceptions.Timeout) as e:
                    attempts += 1
                    if attempts == 10:
                        self.send_response(500)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'error': 'Failed to fetch data after 10 attempts'}).encode('utf-8'))
                        return
            data = response.json()
            
            dreps = data.get('data', [])
            if not dreps:
                break
            
            for dRep in dreps:
                live_power = dRep.get('live_power')
                active_power = dRep.get('active_power')
                if live_power is not None:
                    live_power = float(live_power)
                if active_power is not None:
                    active_power = float(active_power)
                url = dRep.get('url', None)
                given_name = None
                if url:
                    try:
                        print(f"Accessing drep metadata: {url}")
                        response2 = requests.get(url, timeout=10)
                        response2.raise_for_status()
                        given_name = is_valid_jsonld(response2)
                    except requests.RequestException:
                        pass
                all_data.append({
                    'drep_id': dRep.get('view'),
                    'live_power': live_power,
                    'active_power': active_power,
                    'given_name': given_name
                })
            
            if page >= data.get('totalPages', 1):
                break
            page += 1

        all_data = [d for d in all_data if d['live_power'] is not None]
        all_data.sort(key=lambda x: x['live_power'], reverse=True)
        
        # Save to /static/data directory
        static_data_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'data')
        if not os.path.exists(static_data_dir):
            os.makedirs(static_data_dir)
        
        with open(os.path.join(static_data_dir, 'dreps.json'), 'w', encoding='utf-8') as file:
            json.dump(all_data, file, indent=4)
        
        response = {
            'statusCode': 200,
            'body': json.dumps(all_data)
        }

        self.send_response(response['statusCode'])
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(response['body'].encode('utf-8'))
        return
