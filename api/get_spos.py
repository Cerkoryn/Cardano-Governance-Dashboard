import requests
import json
import os

def handler(request):
    response = requests.get('https://www.balanceanalytics.io/api/mavdata.json')
    mavdata = response.json()[0]['mav_data']

    response = requests.get('https://www.balanceanalytics.io/api/groupdata.json')
    groupdata = response.json()[0]['pool_group_json']

    singlepool_stake = 0
    extracted_data = []

    for entry in mavdata:
        label = entry['label']
        stake = entry['stake']
        
        # Check if the label corresponds to a pool_ticker in groupdata with SINGLEPOOL as pool_group
        is_singlepool = False
        for group in groupdata:
            if group['pool_ticker'] == label and group['pool_group'] == 'SINGLEPOOL':
                if label == 'WAVE' or label == '1PCT' or label == 'BLOOM':
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
    
    return {
        'statusCode': 200,
        'body': json.dumps(extracted_data)
    }