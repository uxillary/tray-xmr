import requests
import threading
import time
import psutil
from pystray import Icon, Menu, MenuItem
from PIL import Image, ImageDraw, ImageFont
from plyer import notification

# Your Monero wallet address
wallet_address = "8BMnEhsVFsa9d9xMNbCqVtRXbMKDGkotY9XVBpxFwhr2KTidB3ucgqWMf9ZMNkra6gbyAek1nnfGqFK8UGLpcvx34yqG5eZ"

# Global notification state
last_notified = False

# Create tray icon image with a larger ₥ symbol
def create_icon_image():
    image = Image.new("RGB", (64, 64), "black")
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("arial.ttf", 36)
    except:
        font = ImageFont.load_default()
    draw.text((10, 10), "₥", font=font, fill="white")
    return image

# Get CPU usage percentage with a delay to ensure accuracy
def get_cpu_usage():
    try:
        return f"{psutil.cpu_percent(interval=1)}%"
    except:
        return "N/A"

# Get tooltip text from SupportXMR API + CPU load
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

# Background thread to update tooltip and notify on threshold
def update_tooltip(icon):
    global last_notified
    while True:
        tooltip = fetch_tooltip()
        icon.title = tooltip
        print("Tooltip:", tooltip)  # Optional: remove for silent tray

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

        time.sleep(3600)  # Update every hour

# Quit option
def quit_app(icon, item):
    icon.stop()

# Tray icon setup
icon = Icon("trayxmr")
icon.icon = create_icon_image()
icon.menu = Menu(MenuItem("Quit", quit_app))

# Start tooltip updater thread
threading.Thread(target=update_tooltip, args=(icon,), daemon=True).start()

# Run tray icon
icon.run()
