from http.server import BaseHTTPRequestHandler
import os
import json
import requests

class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        VERCEL_KV_API_URL = os.getenv("KV_REST_API_URL")
        VERCEL_KV_TOKEN = os.getenv("KV_REST_API_TOKEN")
        
        url = f"{VERCEL_KV_API_URL}/get/totals"
        headers = {
            "Authorization": f"Bearer {VERCEL_KV_TOKEN}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            circulating_ada = json.loads(response.json()['result'])
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(circulating_ada).encode('utf-8'))
        else:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'No data available'}).encode('utf-8'))
        return