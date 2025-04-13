import requests
import threading
import time
import psutil
import os
import sys
from pystray import Icon, Menu, MenuItem
from PIL import Image
from plyer import notification

# Your Monero wallet address
wallet_address = "8BMnEhsVFsa9d9xMNbCqVtRXbMKDGkotY9XVBpxFwhr2KTidB3ucgqWMf9ZMNkra6gbyAek1nnfGqFK8UGLpcvx34yqG5eZ"
last_notified = False

# Locate resources correctly whether running from .py or .exe
def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS  # PyInstaller sets this when bundled
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

# Get CPU usage percentage
def get_cpu_usage():
    try:
        return f"{psutil.cpu_percent(interval=1)}%"
    except:
        return "N/A"

# Build the tooltip text
def fetch_tooltip():
    url = f"https://supportxmr.com/api/miner/{wallet_address}/stats"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()

        balance_nano = data.get("stats", {}).get("balance", data.get("amtDue", 0))
        xmr = balance_nano / 1e12
        percent = (xmr / 0.003) * 100

        cpu = get_cpu_usage()
        return f"💰 {xmr:.6f} XMR | 💯 {percent:.1f}% ⏱ {cpu}"
    except Exception as e:
        return f"❌ Error fetching XMR\n{e}"

# Updates the tray tooltip and sends notifications
def update_tooltip(icon):
    global last_notified
    while True:
        tooltip = fetch_tooltip()
        icon.title = tooltip
        print("Tooltip:", tooltip)

        try:
            balance = float(tooltip.split()[1])
            if balance >= 0.003 and not last_notified:
                notification.notify(
                    title="💸 XMR Ready!",
                    message=f"Your balance is {balance:.6f} XMR\nPayout threshold reached.",
                    app_name="trayXMR"
                )
                last_notified = True
        except:
            pass

        time.sleep(3600)

# Exit tray app
def quit_app(icon, item):
    icon.stop()

# Setup tray icon with external .ico
icon = Icon("trayxmr")
icon.icon = Image.open(resource_path("monero_tray_icon.ico"))
icon.menu = Menu(MenuItem("Quit", quit_app))

# Start the background thread
threading.Thread(target=update_tooltip, args=(icon,), daemon=True).start()

# Run tray app
icon.run()
