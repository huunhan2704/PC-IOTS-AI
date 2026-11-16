import time
import json
import threading
import urllib.request
import urllib.error
import tkinter as tk
from tkinter import messagebox, ttk
import psutil
import paho.mqtt.client as mqtt

# ================= CẤU HÌNH HỆ THỐNG =================
API_BASE_URL = "http://localhost:8080/api"
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883


class LoginDialog:
    def __init__(self, root, on_success):
        self.root = root
        self.on_success = on_success
        self.root.title("Đăng Nhập - LinhKien IoT-AI Agent")
        self.root.geometry("360x300")
        self.root.resizable(False, False)
        self.root.configure(bg="#0B0F19")

        frame = tk.Frame(root, bg="#111827", padx=20, pady=20)
        frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=15)

        tk.Label(
            frame, text="LINHKIEN IOT·AI AGENT",
            font=("Segoe UI", 12, "bold"), fg="#38BDF8", bg="#111827"
        ).pack(pady=(0, 4))
        tk.Label(
            frame, text="Đăng nhập tài khoản Shop để giám sát máy",
            font=("Segoe UI", 8), fg="#94A3B8", bg="#111827"
        ).pack(pady=(0, 14))

        tk.Label(frame, text="Tài khoản (Username)", font=("Segoe UI", 9, "bold"), fg="#E2E8F0", bg="#111827", anchor="w").pack(fill=tk.X)
        self.ent_user = tk.Entry(frame, font=("Segoe UI", 10), bg="#0B0F19", fg="#F8FAFC", insertbackground="#38BDF8", relief=tk.FLAT, bd=5)
        self.ent_user.pack(fill=tk.X, pady=(2, 10))
        self.ent_user.insert(0, "nhan")

        tk.Label(frame, text="Mật khẩu", font=("Segoe UI", 9, "bold"), fg="#E2E8F0", bg="#111827", anchor="w").pack(fill=tk.X)
        self.ent_pass = tk.Entry(frame, font=("Segoe UI", 10), show="*", bg="#0B0F19", fg="#F8FAFC", insertbackground="#38BDF8", relief=tk.FLAT, bd=5)
        self.ent_pass.pack(fill=tk.X, pady=(2, 14))
        self.ent_pass.bind("<Return>", lambda e: self.do_login())

        self.btn_login = tk.Button(
            frame, text="Đăng Nhập & Kết Nối Server",
            font=("Segoe UI", 9, "bold"), bg="#0EA5E9", fg="#0B0F19",
            activebackground="#38BDF8", relief=tk.FLAT, pady=8, cursor="hand2",
            command=self.do_login
        )
        self.btn_login.pack(fill=tk.X)

        self.lbl_err = tk.Label(frame, text="", font=("Segoe UI", 8), fg="#F43F5E", bg="#111827")
        self.lbl_err.pack(pady=(8, 0))

    def do_login(self):
        username = self.ent_user.get().strip()
        password = self.ent_pass.get().strip()
        if not username or not password:
            self.lbl_err.config(text="Vui lòng nhập tài khoản và mật khẩu!")
            return

        self.btn_login.config(state=tk.DISABLED, text="Đang kết nối...")
        self.lbl_err.config(text="")
        self.root.update()

        try:
            req_data = json.dumps({"username": username, "password": password}).encode("utf-8")
            req = urllib.request.Request(
                f"{API_BASE_URL}/auth/login",
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                res_json = json.loads(resp.read().decode("utf-8"))
                data = res_json.get("data", {})
                token = data.get("token")
                user = data.get("user", {})

            # Lấy danh sách thiết bị IoT thuộc tài khoản này
            dev_req = urllib.request.Request(
                f"{API_BASE_URL}/iot/devices/my",
                headers={"Authorization": f"Bearer {token}"},
                method="GET",
            )
            with urllib.request.urlopen(dev_req, timeout=8) as d_resp:
                d_json = json.loads(d_resp.read().decode("utf-8"))
                devices = d_json.get("data", [])

            if not devices:
                self.lbl_err.config(text="Tài khoản chưa được gán thiết bị IoT nào! Hãy liên hệ Admin.")
                self.btn_login.config(state=tk.NORMAL, text="Đăng Nhập & Kết Nối Server")
                return

            self.on_success(token, user, devices)
        except urllib.error.HTTPError as e:
            self.lbl_err.config(text=f"Sai tài khoản/mật khẩu (HTTP {e.code})")
            self.btn_login.config(state=tk.NORMAL, text="Đăng Nhập & Kết Nối Server")
        except Exception as e:
            self.lbl_err.config(text="Không kết nối được tới Server Web (8080)")
            self.btn_login.config(state=tk.NORMAL, text="Đăng Nhập & Kết Nối Server")


class PcMonitorApp:
    def __init__(self, root, token, user, devices):
        self.root = root
        self.token = token
        self.user = user
        self.devices = devices
        self.selected_device = devices[0]
        self.device_code = self.selected_device["deviceCode"]

        self.root.title(f"LinhKien IoT·AI Monitor — {user.get('fullName', user.get('username'))}")
        self.root.geometry("400x410")
        self.root.minsize(380, 380)
        self.root.configure(bg="#0B0F19")

        self.mqtt_topic_env = f"iot/environment/{self.device_code}"
        self.is_running = True
        self.mqtt_connected = False
        self.server_ok = True
        self.ambient_temp = 27.5
        self.ambient_humidity = 60.0
        self.tick_count = 0

        # Init MQTT Client (Lắng nghe cảm biến phòng ESP32 DHT22)
        self.client = mqtt.Client()
        self.client.on_connect = self.on_mqtt_connect
        self.client.on_disconnect = self.on_mqtt_disconnect
        self.client.on_message = self.on_mqtt_message

        self.create_widgets()
        self.start_mqtt_thread()
        self.update_telemetry_loop()

        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    def on_mqtt_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.mqtt_connected = True
            self.client.subscribe(self.mqtt_topic_env)
            self.client.subscribe("iot/environment/ESP32_ROOM_01")

    def on_mqtt_disconnect(self, client, userdata, rc):
        self.mqtt_connected = False

    def on_mqtt_message(self, client, userdata, msg):
        try:
            data = json.loads(msg.payload.decode("utf-8"))
            temp = data.get("ambientTemp") or data.get("temperature")
            humidity = data.get("ambientHumidity") or data.get("humidity")
            if temp is not None:
                self.ambient_temp = round(float(temp), 1)
            if humidity is not None:
                self.ambient_humidity = round(float(humidity), 1)
        except Exception:
            pass

    def start_mqtt_thread(self):
        def _connect():
            try:
                self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
                self.client.loop_start()
            except Exception:
                pass
        threading.Thread(target=_connect, daemon=True).start()

    def on_device_change(self, event=None):
        chosen_code = self.device_var.get().split(" - ")[0].strip()
        for d in self.devices:
            if d["deviceCode"] == chosen_code:
                self.selected_device = d
                self.device_code = d["deviceCode"]
                break

    def create_widgets(self):
        # 1. Header Bar
        header_frame = tk.Frame(self.root, bg="#111827", padx=12, pady=8)
        header_frame.pack(fill=tk.X, side=tk.TOP)

        tk.Label(
            header_frame, text="LINHKIEN IOT·AI AGENT",
            font=("Segoe UI", 10, "bold"), fg="#38BDF8", bg="#111827"
        ).pack(side=tk.LEFT)

        self.lbl_status = tk.Label(
            header_frame, text="● Đang gửi về Server",
            font=("Segoe UI", 9, "bold"), fg="#10B981", bg="#111827"
        )
        self.lbl_status.pack(side=tk.RIGHT)

        # 2. Account & Device selector bar
        info_frame = tk.Frame(self.root, bg="#0F172A", padx=12, pady=6)
        info_frame.pack(fill=tk.X, padx=12, pady=(8, 0))

        tk.Label(
            info_frame,
            text=f"Tài khoản: {self.user.get('fullName')} (@{self.user.get('username')})",
            font=("Segoe UI", 8, "bold"), fg="#94A3B8", bg="#0F172A"
        ).pack(anchor="w")

        dev_names = [f"{d['deviceCode']} - {d['deviceName']}" for d in self.devices]
        self.device_var = tk.StringVar(value=dev_names[0])
        combo = ttk.Combobox(info_frame, textvariable=self.device_var, values=dev_names, state="readonly", font=("Segoe UI", 9))
        combo.pack(fill=tk.X, pady=(4, 2))
        combo.bind("<<ComboboxSelected>>", self.on_device_change)

        # 3. Telemetry Display Box
        box_frame = tk.Frame(self.root, bg="#1F2937", bd=2, relief=tk.SOLID)
        box_frame.pack(fill=tk.BOTH, expand=True, padx=12, pady=10)

        top_split = tk.Frame(box_frame, bg="#111827")
        top_split.pack(fill=tk.BOTH, expand=True)

        left_col = tk.Frame(top_split, bg="#111827", padx=15, pady=12)
        left_col.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.lbl_temp = tk.Label(left_col, text="42.0°C Temp", font=("Segoe UI", 13, "bold"), fg="#F43F5E", bg="#111827", anchor="w")
        self.lbl_temp.pack(fill=tk.X, pady=(2, 8))

        self.lbl_cpu = tk.Label(left_col, text="CPU 0.0%", font=("Segoe UI", 13, "bold"), fg="#38BDF8", bg="#111827", anchor="w")
        self.lbl_cpu.pack(fill=tk.X, pady=8)

        self.lbl_ram = tk.Label(left_col, text="RAM 0.0%", font=("Segoe UI", 13, "bold"), fg="#A855F7", bg="#111827", anchor="w")
        self.lbl_ram.pack(fill=tk.X, pady=(8, 2))

        tk.Frame(top_split, bg="#374151", width=2).pack(side=tk.LEFT, fill=tk.Y)

        right_col = tk.Frame(top_split, bg="#111827", padx=15, pady=12, width=130)
        right_col.pack(side=tk.RIGHT, fill=tk.BOTH)
        right_col.pack_propagate(False)

        tk.Label(right_col, text="QUẠT TẢN", font=("Segoe UI", 9, "bold"), fg="#9CA3AF", bg="#111827").pack(pady=(5, 4))
        self.lbl_fan_rpm = tk.Label(right_col, text="1200", font=("Segoe UI", 20, "bold"), fg="#10B981", bg="#111827")
        self.lbl_fan_rpm.pack(pady=4)
        tk.Label(right_col, text="RPM", font=("Segoe UI", 9, "bold"), fg="#6B7280", bg="#111827").pack()

        tk.Frame(box_frame, bg="#374151", height=2).pack(fill=tk.X)

        bottom_bar = tk.Frame(box_frame, bg="#161E2E", padx=15, pady=12)
        bottom_bar.pack(fill=tk.X, side=tk.BOTTOM)

        tk.Label(bottom_bar, text="Nhiệt độ phòng (ESP32):", font=("Segoe UI", 10, "bold"), fg="#E5E7EB", bg="#161E2E").pack(side=tk.LEFT)
        self.lbl_ambient = tk.Label(bottom_bar, text="27.5°C", font=("Segoe UI", 12, "bold"), fg="#FBBF24", bg="#161E2E")
        self.lbl_ambient.pack(side=tk.RIGHT)

    def send_to_server_async(self, payload):
        def _post():
            try:
                data_bytes = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(
                    f"{API_BASE_URL}/iot/telemetry",
                    data=data_bytes,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.token}",
                    },
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=4) as resp:
                    if resp.status == 200:
                        self.server_ok = True
            except Exception:
                self.server_ok = False
        threading.Thread(target=_post, daemon=True).start()

    def update_telemetry_loop(self):
        if not self.is_running:
            return

        try:
            cpu_percent = psutil.cpu_percent(interval=None)
            freq = psutil.cpu_freq()
            cpu_freq = int(freq.current) if freq else 2800

            ram = psutil.virtual_memory()
            ram_percent = ram.percent
            ram_used_gb = round(ram.used / (1024**3), 1)
            ram_total_gb = round(ram.total / (1024**3), 1)

            estimated_temp = round(38.0 + (cpu_percent * 0.45), 1)
            estimated_fan = int(900 + (cpu_percent * 12))

            self.lbl_temp.config(text=f"{estimated_temp}°C Temp")
            self.lbl_cpu.config(text=f"CPU {cpu_percent}%")
            self.lbl_ram.config(text=f"RAM {ram_percent}%")
            self.lbl_fan_rpm.config(text=f"{estimated_fan}")
            self.lbl_ambient.config(text=f"{self.ambient_temp}°C")

            if self.server_ok:
                self.lbl_status.config(text=f"● ONLINE ({self.device_code})", fg="#10B981")
            else:
                self.lbl_status.config(text="● Mất kết nối Server", fg="#EF4444")

            # Gửi dữ liệu về Web Server mỗi 2 giây (kể cả khi không mở trình duyệt web)
            self.tick_count += 1
            if self.tick_count % 2 == 0:
                payload = {
                    "deviceCode": self.device_code,
                    "cpuLoad": cpu_percent,
                    "cpuClockMhz": cpu_freq,
                    "cpuTemp": estimated_temp,
                    "ramUsage": ram_percent,
                    "ramUsedGb": ram_used_gb,
                    "ramTotalGb": ram_total_gb,
                    "gpuLoad": round(cpu_percent * 0.8, 1),
                    "gpuTemp": round(estimated_temp + 3.5, 1),
                    "fanSpeedRpm": estimated_fan,
                    "powerDrawW": int(80 + (cpu_percent * 1.5)),
                    "ambientTemp": self.ambient_temp,
                    "ambientHumidity": self.ambient_humidity,
                }
                self.send_to_server_async(payload)

        except Exception:
            pass

        self.root.after(1000, self.update_telemetry_loop)

    def on_close(self):
        self.is_running = False
        try:
            self.client.loop_stop()
            self.client.disconnect()
        except Exception:
            pass
        self.root.destroy()


def main():
    login_root = tk.Tk()

    def launch_monitor(token, user, devices):
        login_root.destroy()
        app_root = tk.Tk()
        PcMonitorApp(app_root, token, user, devices)
        app_root.mainloop()

    LoginDialog(login_root, launch_monitor)
    login_root.mainloop()


if __name__ == "__main__":
    main()
