import json

# Read the mavdata.json file with UTF-8 encoding
with open('mavdata.json', 'r', encoding='utf-8') as file:
    mavdata = json.load(file)[0]['mav_data']

# Read the groupdata.json file with UTF-8 encoding
with open('groupdata.json', 'r', encoding='utf-8') as file:
    groupdata = json.load(file)[0]['pool_group_json']

# Initialize a variable to accumulate the stake for SINGLEPOOL
singlepool_stake = 0

# Extract the required data
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

# Write the extracted data to mergeddata.json
with open('mergeddata.json', 'w', encoding='utf-8') as file:
    json.dump(extracted_data, file, indent=4)
