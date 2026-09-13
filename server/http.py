"""Small HTTP adapters shared by Vercel and the local development server."""
from http.server import BaseHTTPRequestHandler
import hmac
import json
import logging
import os
import time
import uuid

from server.data import Client, DataError, Store, collect_governance, collect_spo

logger = logging.getLogger('changwatch')


class JSONHandler(BaseHTTPRequestHandler):
    def send_json(self, status, value):
        data = json.dumps(value, allow_nan=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(data)


class ReadHandler(JSONHandler):
    key = None

    def do_GET(self):
        try:
            store = Store()
            data = store.dashboard() if self.key is None else store.read(self.key)
            self.send_json(200, data)
        except Exception as error:
            logger.error(json.dumps({'event': 'read_failed', 'dataset': self.key or 'dashboard',
                                     'error_type': type(error).__name__}))
            self.send_json(503, {'error': 'Dashboard data is temporarily unavailable.'})


class RefreshHandler(JSONHandler):
    kind = 'spo'

    def do_GET(self):
        secret = os.environ.get('CRON_SECRET')
        if not secret or not hmac.compare_digest(self.headers.get('Authorization', '').encode(), ('Bearer ' + secret).encode()):
            self.send_json(403, {'error': 'Forbidden'})
            return
        started = time.monotonic()
        store = None
        locked = False
        owner = str(uuid.uuid4())
        key = 'changwatch:lock:' + self.kind
        try:
            store = Store(Client(budget=55))
            key = store.key(key)
            locked = store.command(['SET', key, owner, 'NX', 'EX', 90]) == 'OK'
            if not locked:
                self.send_json(200, {'status': 'skipped', 'reason': 'Refresh already running'})
                return
            collector = collect_spo if self.kind == 'spo' else collect_governance
            value = collector(Client(budget=40))
            store.publish(value)
            logger.warning(json.dumps({'event': 'refresh_succeeded', 'dataset': self.kind,
                'snapshot_id': value['snapshot_id'], 'rows': len(value['rows']),
                'source_epochs': value['source_epochs'], 'seconds': round(time.monotonic() - started, 2)}))
            self.send_json(200, {'status': 'ok', 'snapshot_id': value['snapshot_id']})
        except Exception as error:
            logger.error(json.dumps({'event': 'refresh_failed', 'dataset': self.kind,
                'error_type': type(error).__name__,
                'reason': str(error) if isinstance(error, DataError) else 'Invalid upstream data',
                'seconds': round(time.monotonic() - started, 2)}))
            self.send_json(503, {'error': 'Refresh failed. Last successful data retained.'})
        finally:
            if store and locked:
                try:
                    store.command(['EVAL', "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end", 1, key, owner])
                except Exception:
                    # The lock expires even if release fails; never delete another invocation's lock.
                    logger.warning(json.dumps({'event': 'lock_release_failed', 'dataset': self.kind}))
