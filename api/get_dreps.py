import requests
import json
import os

def fetch_dreps(base_url):
    page = 0
    all_data = []

    while True:
        response = requests.get(base_url.format(page))
        data = response.json()
        
        elements = data.get('elements', [])
        if not elements:
            break
        
        for element in elements:
            voting_power = element['votingPower']
            if voting_power is not None:
                voting_power /= 1_000_000  # Convert lovelaces to ADA
            all_data.append({
                'label': element['view'],
                'votingPower': voting_power
            })
        
        page += 1

    return all_data

def save_to_json(data, filename):
    with open(filename, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4)

def handler(request):
    base_url = "https://sanchogov.tools/api/drep/list?status=Active&sort=VotingPower&page={}&pageSize=100"
    all_data = fetch_dreps(base_url)
    all_data = [d for d in all_data if d['votingPower'] is not None]
    all_data.sort(key=lambda x: x['votingPower'], reverse=True)
    
    # Save to /static/data directory
    static_data_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'data')
    if not os.path.exists(static_data_dir):
        os.makedirs(static_data_dir)
    
    save_to_json(all_data, os.path.join(static_data_dir, 'dreps.json'))
    
    return {
        'statusCode': 200,
        'body': json.dumps(all_data)
    }