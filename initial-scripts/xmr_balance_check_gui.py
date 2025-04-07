import requests
from datetime import datetime
import tkinter as tk
from tkinter import messagebox

wallet_address = "8BMnEhsVFsa9d9xMNbCqVtRXbMKDGkotY9XVBpxFwhr2KTidB3ucgqWMf9ZMNkra6gbyAek1nnfGqFK8UGLpcvx34yqG5eZ"

def fetch_balance():
    url = f"https://supportxmr.com/api/miner/{wallet_address}/stats"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()

        if "stats" in data:
            balance_nano = data["stats"]["balance"]
        elif "amtDue" in data:
            balance_nano = data["amtDue"]
        else:
            return "Could not find balance data."

        balance_xmr = balance_nano / 1e12
        threshold = 0.003
        percent = (balance_xmr / threshold) * 100

        return (
            f"🕒 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"💰 Balance: {balance_xmr:.6f} XMR\n"
            f"📈 Progress to payout (0.003 XMR): {percent:.1f}%"
        )

    except Exception as e:
        return f"⚠️ Error fetching balance:\n{e}"

# GUI
root = tk.Tk()
root.withdraw()  # Hide the main window
messagebox.showinfo("XMR Balance Checker", fetch_balance())
