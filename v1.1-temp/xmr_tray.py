import requests
from datetime import datetime
from pystray import Icon, Menu, MenuItem
from PIL import Image, ImageDraw
import threading
import time
import platform
from plyer import notification

wallet_address = "8BMnEhsVFsa9d9xMNbCqVtRXbMKDGkotY9XVBpxFwhr2KTidB3ucgqWMf9ZMNkra6gbyAek1nnfGqFK8UGLpcvx34yqG5eZ"
last_notified = False

def create_icon_image():
    image = Image.new("RGB", (64, 64), "black")
    draw = ImageDraw.Draw(image)
    draw.text((16, 24), "₥", fill="white")
    return image

def get_cpu_temp():
    try:
        response = requests.get("http://localhost:8085/data.json", timeout=3)
        sensors = response.json()
        for hw in sensors["Children"]:
            if hw["Text"].lower().startswith("cpu"):
                for sensor in hw["Children"]:
                    for entry in sensor["Children"]:
                        if "temperature" in entry["Text"].lower():
                            return float(entry["Value"].replace("°C", "").strip())
    except Exception as e:
        print("Temp read error:", e)
    return "N/A"

def fetch_tooltip():
    url = f"https://supportxmr.com/api/miner/{wallet_address}/stats"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()

        balance_nano = data.get("stats", {}).get("balance", data.get("amtDue", 0))
        xmr = balance_nano / 1e12
        percent = (xmr / 0.003) * 100

        temp = get_cpu_temp()
        temp_str = f" 🌡 {temp}°C" if temp != "N/A" else " 🌡 N/A"

        return f"💰 {xmr:.6f} XMR | 💯 {percent:.1f}%{temp_str}"
    except Exception as e:
        return f"❌ Error fetching XMR\n{e}"

def update_tooltip(icon):
    global last_notified
    while True:
        tooltip = fetch_tooltip()
        icon.title = tooltip
        print("Tooltip:", tooltip)  # You can remove this later

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

def quit_app(icon, item):
    icon.stop()

icon = Icon("trayxmr")
icon.icon = create_icon_image()
icon.menu = Menu(MenuItem("Quit", quit_app))

threading.Thread(target=update_tooltip, args=(icon,), daemon=True).start()

icon.run()
