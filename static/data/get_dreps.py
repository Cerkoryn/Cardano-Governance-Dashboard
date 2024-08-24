import requests
import json

def fetch_dreps(base_url):
    page = 0
    all_data = []

    while True:
        response = requests.get(base_url.format(page))
        data = response.json()
        
        elements = data.get('elements', [])
        if not elements:  # If elements array is empty, break the loop
            break
        
        for element in elements:
            all_data.append({
                'label': element['drepId'],
                'votingPower': element['votingPower']
            })
        
        page += 1

    return all_data

def save_to_json(data, filename):
    with open(filename, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4)

if __name__ == "__main__":
    base_url = "https://sanchogov.tools/api/drep/list?status=Active&sort=VotingPower&page={}&pageSize=100"
    all_data = fetch_dreps(base_url)
    all_data = [d for d in all_data if d['votingPower'] is not None]
    all_data.sort(key=lambda x: x['votingPower'], reverse=True)
    save_to_json(all_data, 'dreps.json')
