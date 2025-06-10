import ctypes
import sys
import customtkinter as ctk
import subprocess
import tkinter.messagebox as messagebox
import threading
import re

# --- Auto-Elevation (UAC Prompt) ---
def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

if not is_admin():
    ctypes.windll.shell32.ShellExecuteW(
        None, "runas", sys.executable, " ".join(sys.argv), None, 1)
    sys.exit()

# --- GUI Setup ---
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("dark-blue")

class MinerApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("XMR Miner Dashboard")
        self.geometry("500x350")
        self.resizable(False, False)

        self.status_label = ctk.CTkLabel(self, text="Status: Idle", font=ctk.CTkFont(size=16, weight="bold"), text_color="gold")
        self.status_label.pack(pady=(20, 5))

        self.hashrate_label = ctk.CTkLabel(self, text="Hashrate: 0 H/s", font=ctk.CTkFont(size=14))
        self.hashrate_label.pack(pady=5)

        self.shares_label = ctk.CTkLabel(self, text="Shares: 0 / 0", font=ctk.CTkFont(size=14))
        self.shares_label.pack(pady=5)

        self.start_btn = ctk.CTkButton(self, text="⛏️  Start Mining", font=ctk.CTkFont(size=14), width=160, command=self.start_miner)
        self.start_btn.pack(pady=10)

        self.stop_btn = ctk.CTkButton(self, text="🛑  Stop Mining", font=ctk.CTkFont(size=14), width=160, command=self.stop_miner)
        self.stop_btn.pack(pady=10)

        self.process = None
        self.output_thread = None

    def start_miner(self):
        if self.process is None:
            try:
                self.status_label.configure(text="Status: Starting...", text_color="yellow")
                self.process = subprocess.Popen(
                    [r"C:\xmrig-6.22.2\xmrig.exe"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    bufsize=1,
                    universal_newlines=True
                )
                self.status_label.configure(text="Status: Mining Started", text_color="green")
                # Pass the process object to the reader thread so it is not
                # affected if self.process is later reset in stop_miner
                self.output_thread = threading.Thread(
                    target=self.read_output,
                    args=(self.process,),
                    daemon=True
                )
                self.output_thread.start()
            except PermissionError:
                self.status_label.configure(text="Access denied.", text_color="red")
                messagebox.showerror("Permission Denied", "Failed to start XMRig. Try running as Administrator.")
            except FileNotFoundError:
                self.status_label.configure(text="Executable not found.", text_color="red")
                messagebox.showerror("Not Found", "Could not find xmrig.exe at the given path.")
            except Exception as e:
                self.status_label.configure(text="Error launching miner.", text_color="red")
                messagebox.showerror("Error", f"Unexpected error:\n{str(e)}")

    def read_output(self, process):
        """Read miner output and update the GUI labels."""
        share_match = re.compile(r"accepted\s+\((\d+)/(\d+)\)")
        hashrate_match = re.compile(r"speed.*?(\d+(?:\.\d+)?)\s+H/s")

        while True:
            if process.poll() is not None:
                break

            line = process.stdout.readline()
            if not line:
                continue

            # Check for share updates
            share_found = share_match.search(line)
            if share_found:
                accepted, total = share_found.groups()
                self.shares_label.configure(text=f"Shares: {accepted} / {total}")

            # Check for hashrate updates
            hashrate_found = hashrate_match.search(line)
            if hashrate_found:
                rate = hashrate_found.group(1)
                self.hashrate_label.configure(text=f"Hashrate: {rate} H/s")

    def stop_miner(self):
        if self.process:
            self.process.terminate()
            # Wait briefly for the process to exit to avoid race conditions with
            # the reader thread.
            try:
                self.process.wait(timeout=5)
            except Exception:
                pass
            self.process = None
            self.status_label.configure(text="Status: Miner stopped.", text_color="gold")

if __name__ == "__main__":
    app = MinerApp()
    app.mainloop()
