import customtkinter as ctk
import subprocess
import threading

ctk.set_appearance_mode("dark")  # "light" or "dark"
ctk.set_default_color_theme("blue")  # Options: "blue", "green", "dark-blue"

class MinerApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("My XMR Miner GUI")
        self.geometry("400x300")

        self.status_label = ctk.CTkLabel(self, text="Miner status: Idle")
        self.status_label.pack(pady=20)

        self.start_btn = ctk.CTkButton(self, text="Start Mining", command=self.start_miner)
        self.start_btn.pack(pady=10)

        self.stop_btn = ctk.CTkButton(self, text="Stop Mining", command=self.stop_miner)
        self.stop_btn.pack(pady=10)

        self.process = None

    def start_miner(self):
        if self.process is None:
            self.status_label.configure(text="Starting miner...")
            self.process = subprocess.Popen(
                ["C:\xmrig-6.22.2"],  # CHANGE THIS IF YOUR xmrig IS IN A DIFFERENT LOCATION
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            self.status_label.configure(text="Mining started.")

    def stop_miner(self):
        if self.process:
            self.process.terminate()
            self.process = None
            self.status_label.configure(text="Miner stopped.")

if __name__ == "__main__":
    app = MinerApp()
    app.mainloop()
