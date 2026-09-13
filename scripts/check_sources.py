"""Read-only upstream smoke check; never connects to Redis or writes snapshots."""
import json
from pathlib import Path
import sys
import time
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server.data import Client, collect_governance, collect_spo

if __name__ == '__main__':
    for kind, collect in [('spo', collect_spo), ('governance', collect_governance)]:
        started = time.monotonic()
        value = collect(Client(budget=40))
        print(json.dumps({'kind': kind, 'rows': len(value['rows']), 'source_epochs': value['source_epochs'],
                          'seconds': round(time.monotonic() - started, 2), 'totals': value['totals']}))
