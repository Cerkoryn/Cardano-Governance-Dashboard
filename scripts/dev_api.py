"""Local API server. Env vars must be supplied by the caller; never loads production credentials."""
from http.server import ThreadingHTTPServer
import importlib
import sys
from pathlib import Path
from urllib.parse import urlparse
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server.http import JSONHandler

ROUTES = {name: importlib.import_module('api.' + name).handler for name in (
    'get_dashboard', 'get_spos', 'get_spo_totals', 'get_dreps', 'get_drep_totals',
    'update_spos_and_totals', 'update_dreps_and_totals')}

class Router(JSONHandler):
    def do_GET(self):
        route = ROUTES.get(urlparse(self.path).path.removeprefix('/api/'))
        if route is None:
            self.send_json(404, {'error': 'Not found'})
            return
        self.key = getattr(route, 'key', None)
        self.kind = getattr(route, 'kind', None)
        route.do_GET(self)

if __name__ == '__main__':
    print('Local API listening on http://127.0.0.1:8000', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8000), Router).serve_forever()
