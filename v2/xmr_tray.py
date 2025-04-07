import requests
from datetime import datetime
from pystray import Icon, Menu, MenuItem
from PIL import Image, ImageDraw
import threading
import time

import json
import os

import sys

def load_config():
    if getattr(sys, 'frozen', False):
        # Running from EXE
        base_path = sys._MEIPASS
    else:
        # Running from script
        base_path = os.path.dirname(__file__)

    config_path = os.path.join(base_path, "config.json")
    with open(config_path, "r") as f:
        config = json.load(f)

    address = config["address"]
    pool_key = config["pool"]
    pool_url = config["pools"][pool_key]["url"].replace("{address}", address)
    return address, pool_url

wallet_address, miner_api_url = load_config()

def create_icon_image():
    image = Image.new("RGB", (64, 64), "black")
    draw = ImageDraw.Draw(image)
    draw.text((16, 24), "₥", fill="white")  # Monero-like "M"
    return image

def fetch_tooltip():
    url = miner_api_url
    try:
        response = requests.get(url, timeout=10)
        data = response.json()

        balance_nano = data.get("stats", {}).get("balance", data.get("amtDue", 0))
        xmr = balance_nano / 1e12
        percent = (xmr / 0.003) * 100

        return f"💰 {xmr:.6f} XMR | ⏳ {percent:.1f}% to payout"
    except Exception as e:
        return f"❌ Error fetching XMR\n{e}"

from plyer import notification

last_notified = False

def update_tooltip(icon):
    global last_notified
    while True:
        tooltip = fetch_tooltip()
        icon.title = tooltip

        # Check if payout threshold hit
        try:
            balance = float(tooltip.split()[1])  # crude but works
            if balance >= 0.003 and not last_notified:
                notification.notify(
                    title="💸 XMR Ready!",
                    message=f"Your balance is {balance:.6f} XMR\nPayout threshold reached.",
                    app_name="trayXMR"
                )
                last_notified = True
        except:
            pass

        time.sleep(3600) # check every hour — change to 14400 for every 4 hrs

def quit_app(icon, item):
    icon.stop()

# Create the icon
icon = Icon("trayxmr")
icon.icon = create_icon_image()
icon.menu = Menu(MenuItem("Quit", quit_app))

# Start tooltip updater in background
threading.Thread(target=update_tooltip, args=(icon,), daemon=True).start()

icon.run()
