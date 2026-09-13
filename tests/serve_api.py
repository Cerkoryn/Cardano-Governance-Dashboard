"""Local integration fixture server. Uses real read handlers; replaces only Redis."""
import json
from datetime import datetime, timezone
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import http
from scripts.dev_api import Router
from http.server import ThreadingHTTPServer

class FixtureStore:
    def dashboard(self):
        value = json.loads((Path(__file__).parent / 'fixtures/dashboard.json').read_text())
        for source in value.values(): source['updated_at'] = datetime.now(timezone.utc).isoformat()
        return value
    def read(self, key):
        raise RuntimeError('Legacy routes are covered by storage unit tests')

if __name__ == '__main__':
    http.Store = FixtureStore
    ThreadingHTTPServer(('127.0.0.1', 8000), Router).serve_forever()
