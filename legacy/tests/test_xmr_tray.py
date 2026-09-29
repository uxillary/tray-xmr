import importlib.util
from types import ModuleType
import sys
import json
from pathlib import Path


def import_xmr_tray(monkeypatch, config_path):
    """Import v2/xmr_tray.py with dependencies stubbed."""
    # Stub modules that are not installed
    dummy_requests = ModuleType("requests")
    dummy_requests.get = lambda *a, **k: None
    sys.modules['requests'] = dummy_requests

    dummy_pystray = ModuleType('pystray')
    class DummyIcon:
        def __init__(self, *a, **kw):
            self.title = ""
            self.icon = None
            self.menu = None
        def run(self):
            pass
    dummy_pystray.Icon = DummyIcon
    dummy_pystray.Menu = lambda *a, **kw: None
    dummy_pystray.MenuItem = lambda *a, **kw: None
    sys.modules['pystray'] = dummy_pystray

    pil_module = ModuleType('PIL')
    pil_image = ModuleType('PIL.Image')
    class DummyImage:
        pass
    pil_image.new = lambda *a, **kw: DummyImage()
    pil_imagedraw = ModuleType('PIL.ImageDraw')
    class DummyDraw:
        def text(self, *a, **kw):
            pass
    pil_imagedraw.Draw = lambda img: DummyDraw()
    pil_module.Image = pil_image
    pil_module.ImageDraw = pil_imagedraw
    sys.modules['PIL'] = pil_module
    sys.modules['PIL.Image'] = pil_image
    sys.modules['PIL.ImageDraw'] = pil_imagedraw

    plyer_module = ModuleType('plyer')
    notification_module = ModuleType('plyer.notification')
    notification_module.notify = lambda **kw: None
    plyer_module.notification = notification_module
    sys.modules['plyer'] = plyer_module
    sys.modules['plyer.notification'] = notification_module

    class DummyThread:
        def __init__(self, *a, **kw):
            pass
        def start(self):
            pass
    monkeypatch.setattr('threading.Thread', DummyThread)

    import os
    original_join = os.path.join
    def fake_join(a, b):
        if b == 'config.json':
            return str(config_path)
        return original_join(a, b)
    monkeypatch.setattr(os.path, 'join', fake_join)

    spec = importlib.util.spec_from_file_location('xmr_tray', Path(__file__).resolve().parents[1] / 'v2' / 'xmr_tray.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_load_config(tmp_path, monkeypatch):
    cfg = {
        'address': 'abc123',
        'pool': 'supportxmr',
        'pools': {
            'supportxmr': {'url': 'https://example.com/{address}'}
        }
    }
    cfg_file = tmp_path / 'config.json'
    cfg_file.write_text(json.dumps(cfg))
    mod = import_xmr_tray(monkeypatch, cfg_file)

    address, url = mod.load_config()
    assert address == cfg['address']
    assert url == 'https://example.com/abc123'


def test_fetch_tooltip(tmp_path, monkeypatch):
    cfg = {
        'address': 'abc123',
        'pool': 'supportxmr',
        'pools': {
            'supportxmr': {'url': 'https://example.com/{address}'}
        }
    }
    cfg_file = tmp_path / 'config.json'
    cfg_file.write_text(json.dumps(cfg))
    mod = import_xmr_tray(monkeypatch, cfg_file)

    class DummyResp:
        def json(self):
            return {'stats': {'balance': 1000000000}}

    def fake_get(url, timeout=10):
        assert url == 'https://example.com/abc123'
        return DummyResp()

    monkeypatch.setattr(mod.requests, 'get', fake_get)
    tooltip = mod.fetch_tooltip()
    assert tooltip == '💰 0.001000 XMR | ⏳ 33.3% to payout'
