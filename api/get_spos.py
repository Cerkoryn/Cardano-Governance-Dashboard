from http.server import BaseHTTPRequestHandler
import requests
import json
import os

class handler(BaseHTTPRequestHandler):

    def do_GET(self):
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
        
        # Save to /static/data directory
        static_data_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'data')
        if not os.path.exists(static_data_dir):
            os.makedirs(static_data_dir)
        
        with open(os.path.join(static_data_dir, 'spos.json'), 'w', encoding='utf-8') as file:
            json.dump(extracted_data, file, indent=4)
        
        response = {
            'statusCode': 200,
            'body': json.dumps(extracted_data)
        }

        self.send_response(response['statusCode'])
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(response['body'].encode('utf-8'))
        return