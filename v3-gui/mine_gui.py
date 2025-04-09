import customtkinter as ctk
import subprocess
import tkinter.messagebox as messagebox

ctk.set_appearance_mode("dark")  # "light" or "dark"
ctk.set_default_color_theme("dark-blue")  # Options: "blue", "green", "dark-blue"

class MinerApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("My XMR Miner GUI")
        self.geometry("400x300")
        self.resizable(False, False)

        self.status_label = ctk.CTkLabel(
            self,
            text="Miner status: Idle",
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color="gold"
        )
        self.status_label.pack(pady=(30, 10))

        self.start_btn = ctk.CTkButton(
            self,
            text="⛏️  Start Mining",
            font=ctk.CTkFont(size=14),
            width=160,
            command=self.start_miner
        )
        self.start_btn.pack(pady=10)

        self.stop_btn = ctk.CTkButton(
            self,
            text="🛑  Stop Mining",
            font=ctk.CTkFont(size=14),
            width=160,
            command=self.stop_miner
        )
        self.stop_btn.pack(pady=10)

        self.process = None

    def start_miner(self):
        if self.process is None:
            try:
                self.status_label.configure(text="Starting miner...")
                self.process = subprocess.Popen(
                    [r"C:\xmrig-6.22.2\xmrig.exe"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                self.status_label.configure(text="Mining started.")
            except PermissionError:
                self.status_label.configure(text="Access denied.")
                messagebox.showerror("Permission Denied", "Failed to start XMRig. Try running as Administrator.")
            except FileNotFoundError:
                self.status_label.configure(text="Executable not found.")
                messagebox.showerror("Not Found", "Could not find xmrig.exe at the given path.")
            except Exception as e:
                self.status_label.configure(text="Error launching miner.")
                messagebox.showerror("Error", f"Unexpected error:\n{str(e)}")

    def stop_miner(self):
        if self.process:
            self.process.terminate()
            self.process = None
            self.status_label.configure(text="Miner stopped.")

if __name__ == "__main__":
    app = MinerApp()
    app.mainloop()
