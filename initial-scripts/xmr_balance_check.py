import requests
from datetime import datetime

wallet_address = "8BMnEhsVFsa9d9xMNbCqVtRXbMKDGkotY9XVBpxFwhr2KTidB3ucgqWMf9ZMNkra6gbyAek1nnfGqFK8UGLpcvx34yqG5eZ"

def fetch_xmr_balance():
    url = f"https://supportxmr.com/api/miner/{wallet_address}/stats"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()

        print("\n🕒", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

        # Preferred method if 'stats' exists
        if "stats" in data:
            balance_nano = data['stats']['balance']
        # Fallback to 'amtDue' if not
        elif "amtDue" in data:
            balance_nano = data['amtDue']
            print("⚠️ 'stats' not found, using 'amtDue' as fallback.")
        else:
            print("❌ Could not find balance in API response.")
            print("Raw response:", data)
            return

        balance_xmr = balance_nano / 1e12
        threshold = 0.003
        percent = (balance_xmr / threshold) * 100

        print(f"💰 Pending Balance: {balance_xmr:.6f} XMR")
        print(f"📈 To Payout Threshold (0.003 XMR): {percent:.1f}%")

    except Exception as e:
        print("⚠️ Error fetching balance:", e)

if __name__ == "__main__":
    fetch_xmr_balance()
