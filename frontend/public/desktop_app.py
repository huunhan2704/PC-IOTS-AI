import time
import json
import subprocess
import threading
import urllib.request
import urllib.error
import tkinter as tk
from tkinter import ttk
import psutil
import paho.mqtt.client as mqtt

# ================= CẤU HÌNH HỆ THỐNG =================
CLOUD_API_BASE_URL = "https://pc-iots-ai-production.up.railway.app/api"
LOCAL_API_BASE_URL = "http://localhost:8080/api"
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
CREATE_NO_WINDOW = 0x08000000


class RealHardwareSensorReader:
    """
    Đọc thông số phần cứng THẬT từ máy tính (OS / Driver / WMI / nvidia-smi).
    Tuyệt đối KHÔNG dùng công thức đoán mù hay ước lượng giả từ % CPU.
    Nếu máy không có cảm biến vật lý tương ứng thì trả về 0.
    """

    def __init__(self):
        self.lock = threading.Lock()
        self.cpu_temp = 0.0
        self.gpu_load = 0.0
        self.gpu_temp = 0.0
        self.fan_rpm = 0
        self.power_w = 0
        self.running = True
        threading.Thread(target=self._poll_hardware_sensors_loop, daemon=True).start()

    def stop(self):
        self.running = False

    def _query_nvidia_smi(self):
        try:
            out = subprocess.check_output(
                [
                    "nvidia-smi",
                    "--query-gpu=utilization.gpu,temperature.gpu,fan.speed,power.draw",
                    "--format=csv,noheader,nounits",
                ],
                creationflags=CREATE_NO_WINDOW,
                timeout=2,
                stderr=subprocess.DEVNULL,
            ).decode("utf-8", errors="ignore").strip()
            if not out:
                return None
            first_line = out.splitlines()[0]
            parts = [p.strip() for p in first_line.split(",")]
            res = {}
            if len(parts) >= 1 and parts[0].replace(".", "", 1).isdigit():
                res["gpu_load"] = round(float(parts[0]), 1)
            if len(parts) >= 2 and parts[1].replace(".", "", 1).isdigit():
                res["gpu_temp"] = round(float(parts[1]), 1)
            if len(parts) >= 4 and parts[3].replace(".", "", 1).isdigit():
                res["power_w"] = int(round(float(parts[3])))
            return res
        except Exception:
            return None

    def _query_windows_wmi_sensors(self):
        """
        Đọc cảm biến thật từ LibreHardwareMonitor / OpenHardwareMonitor WMI (nếu có chạy)
        hoặc MSAcpi_ThermalZoneTemperature / Win32_Fan / GPU Engine Counter của Windows.
        """
        ps_script = r"""
$ErrorActionPreference = 'SilentlyContinue'
$result = @{ cpuTemp = 0; gpuLoad = 0; gpuTemp = 0; fanRpm = 0; powerW = 0 }

foreach ($ns in @('root\LibreHardwareMonitor', 'root\OpenHardwareMonitor')) {
    $sensors = Get-CimInstance -Namespace $ns -ClassName Sensor
    if ($sensors) {
        foreach ($s in $sensors) {
            $val = [double]$s.Value
            if ($s.SensorType -eq 'Temperature' -and $s.Name -match 'CPU|Core|Package' -and $val -gt 0) {
                if ($val -gt $result.cpuTemp) { $result.cpuTemp = [math]::Round($val, 1) }
            }
            if ($s.SensorType -eq 'Temperature' -and $s.Name -match 'GPU' -and $val -gt 0) {
                if ($val -gt $result.gpuTemp) { $result.gpuTemp = [math]::Round($val, 1) }
            }
            if ($s.SensorType -eq 'Load' -and $s.Name -match 'GPU Core|D3D 3D' -and $val -ge 0) {
                if ($val -gt $result.gpuLoad) { $result.gpuLoad = [math]::Round($val, 1) }
            }
            if ($s.SensorType -eq 'Fan' -and $val -gt 0) {
                if ($val -gt $result.fanRpm) { $result.fanRpm = [int][math]::Round($val) }
            }
            if ($s.SensorType -eq 'Power' -and $s.Name -match 'Package|Total|CPU|GPU' -and $val -gt 0) {
                $result.powerW += [int][math]::Round($val)
            }
        }
        break
    }
}

if ($result.cpuTemp -eq 0) {
    $tz = Get-CimInstance -Namespace 'root\wmi' -ClassName MSAcpi_ThermalZoneTemperature | Select-Object -First 1
    if ($tz -and $tz.CurrentTemperature -gt 2732) {
        $c = ($tz.CurrentTemperature / 10.0) - 273.15
        if ($c -gt 0 -and $c -lt 115) { $result.cpuTemp = [math]::Round($c, 1) }
    }
}

if ($result.fanRpm -eq 0) {
    $fan = Get-CimInstance -ClassName Win32_Fan | Select-Object -First 1
    if ($fan -and $fan.DesiredSpeed -gt 0) {
        $result.fanRpm = [int]$fan.DesiredSpeed
    }
}

$result | ConvertTo-Json -Compress
"""
        try:
            out = subprocess.check_output(
                ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
                creationflags=CREATE_NO_WINDOW,
                timeout=3,
                stderr=subprocess.DEVNULL,
            ).decode("utf-8", errors="ignore").strip()
            if out:
                return json.loads(out)
        except Exception:
            pass
        return None

    def _poll_hardware_sensors_loop(self):
        while self.running:
            nv = self._query_nvidia_smi()
            wmi_data = self._query_windows_wmi_sensors()

            cpu_t = 0.0
            gpu_l = 0.0
            gpu_t = 0.0
            fan_r = 0
            pwr_w = 0

            if wmi_data:
                cpu_t = float(wmi_data.get("cpuTemp") or 0.0)
                gpu_l = float(wmi_data.get("gpuLoad") or 0.0)
                gpu_t = float(wmi_data.get("gpuTemp") or 0.0)
                fan_r = int(wmi_data.get("fanRpm") or 0)
                pwr_w = int(wmi_data.get("powerW") or 0)

            if nv:
                if nv.get("gpu_load") is not None:
                    gpu_l = nv["gpu_load"]
                if nv.get("gpu_temp") is not None and nv["gpu_temp"] > 0:
                    gpu_t = nv["gpu_temp"]
                if nv.get("power_w") is not None and nv["power_w"] > 0:
                    pwr_w = max(pwr_w, nv["power_w"])

            with self.lock:
                self.cpu_temp = cpu_t
                self.gpu_load = gpu_l
                self.gpu_temp = gpu_t
                self.fan_rpm = fan_r
                self.power_w = pwr_w

            time.sleep(2.0)

    def get_snapshot(self):
        cpu_percent = round(psutil.cpu_percent(interval=None), 1)
        freq = psutil.cpu_freq()
        cpu_freq = int(round(freq.current)) if (freq and freq.current) else 0

        ram = psutil.virtual_memory()
        ram_percent = round(ram.percent, 1)
        ram_used_gb = round(ram.used / (1024 ** 3), 1)
        ram_total_gb = round(ram.total / (1024 ** 3), 1)

        with self.lock:
            return {
                "cpuLoad": cpu_percent,
                "cpuClockMhz": cpu_freq,
                "cpuTemp": self.cpu_temp,
                "ramUsage": ram_percent,
                "ramUsedGb": ram_used_gb,
                "ramTotalGb": ram_total_gb,
                "gpuLoad": self.gpu_load,
                "gpuTemp": self.gpu_temp,
                "fanSpeedRpm": self.fan_rpm,
                "powerDrawW": self.power_w,
            }


class LoginDialog:
    def __init__(self, root, on_success):
        self.root = root
        self.on_success = on_success
        self.root.title("Đăng Nhập Tài Khoản - LinhKien IoT·AI Desktop Agent")
        self.root.geometry("410x340")
        self.root.resizable(False, False)
        self.root.configure(bg="#0B0F19")

        frame = tk.Frame(root, bg="#111827", padx=22, pady=20)
        frame.pack(fill=tk.BOTH, expand=True, padx=14, pady=14)

        tk.Label(
            frame,
            text="LINHKIEN IOT·AI DESKTOP AGENT",
            font=("Segoe UI", 12, "bold"),
            fg="#38BDF8",
            bg="#111827",
        ).pack(pady=(0, 4))
        tk.Label(
            frame,
            text="Bắt buộc đăng nhập Tài khoản đã mua PC để kết nối & đo đạc",
            font=("Segoe UI", 8),
            fg="#94A3B8",
            bg="#111827",
        ).pack(pady=(0, 14))

        tk.Label(
            frame,
            text="Tài khoản (Username) *",
            font=("Segoe UI", 9, "bold"),
            fg="#E2E8F0",
            bg="#111827",
            anchor="w",
        ).pack(fill=tk.X)
        self.ent_user = tk.Entry(
            frame,
            font=("Segoe UI", 10),
            bg="#0B0F19",
            fg="#F8FAFC",
            insertbackground="#38BDF8",
            relief=tk.FLAT,
            bd=6,
        )
        self.ent_user.pack(fill=tk.X, pady=(2, 10))
        self.ent_user.focus_set()

        tk.Label(
            frame,
            text="Mật khẩu *",
            font=("Segoe UI", 9, "bold"),
            fg="#E2E8F0",
            bg="#111827",
            anchor="w",
        ).pack(fill=tk.X)
        self.ent_pass = tk.Entry(
            frame,
            font=("Segoe UI", 10),
            show="*",
            bg="#0B0F19",
            fg="#F8FAFC",
            insertbackground="#38BDF8",
            relief=tk.FLAT,
            bd=6,
        )
        self.ent_pass.pack(fill=tk.X, pady=(2, 14))
        self.ent_pass.bind("<Return>", lambda e: self.do_login())

        self.btn_login = tk.Button(
            frame,
            text="Đăng Nhập Tài Khoản & Kết Nối PC",
            font=("Segoe UI", 9, "bold"),
            bg="#0EA5E9",
            fg="#0B0F19",
            activebackground="#38BDF8",
            relief=tk.FLAT,
            pady=8,
            cursor="hand2",
            command=self.do_login,
        )
        self.btn_login.pack(fill=tk.X)

        self.lbl_err = tk.Label(
            frame,
            text="",
            font=("Segoe UI", 8),
            fg="#F43F5E",
            bg="#111827",
            wraplength=340,
            justify="center",
        )
        self.lbl_err.pack(pady=(10, 0))

    def _try_login_endpoint(self, base_url, username, password):
        req_data = json.dumps({"username": username, "password": password}).encode("utf-8")
        req = urllib.request.Request(
            f"{base_url}/auth/login",
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            data = res_json.get("data", {})
            token = data.get("token")
            user = data.get("user", {})

        dev_req = urllib.request.Request(
            f"{base_url}/iot/devices/my",
            headers={"Authorization": f"Bearer {token}"},
            method="GET",
        )
        with urllib.request.urlopen(dev_req, timeout=8) as d_resp:
            d_json = json.loads(d_resp.read().decode("utf-8"))
            devices = d_json.get("data", [])

        return base_url, token, user, devices

    def do_login(self):
        username = self.ent_user.get().strip()
        password = self.ent_pass.get().strip()
        if not username or not password:
            self.lbl_err.config(text="Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!")
            return

        self.btn_login.config(state=tk.DISABLED, text="Đang xác thực tài khoản...")
        self.lbl_err.config(text="")
        self.root.update()

        last_err = None
        for candidate_url in (CLOUD_API_BASE_URL, LOCAL_API_BASE_URL):
            try:
                api_url, token, user, devices = self._try_login_endpoint(candidate_url, username, password)
                if not devices:
                    self.lbl_err.config(
                        text="Tài khoản chưa có Node IoT nào! Hệ thống sẽ tự cấp Node ESP32 sau khi đơn hàng Build PC của bạn được xác nhận."
                    )
                    self.btn_login.config(state=tk.NORMAL, text="Đăng Nhập Tài Khoản & Kết Nối PC")
                    return

                self.on_success(api_url, token, user, devices)
                return
            except urllib.error.HTTPError as e:
                if e.code in (400, 401, 403):
                    self.lbl_err.config(text="Sai tên đăng nhập hoặc mật khẩu!")
                    self.btn_login.config(state=tk.NORMAL, text="Đăng Nhập Tài Khoản & Kết Nối PC")
                    return
                last_err = f"HTTP {e.code}"
            except Exception as e:
                last_err = str(e)

        self.lbl_err.config(text=f"Không thể kết nối Server ({last_err})")
        self.btn_login.config(state=tk.NORMAL, text="Đăng Nhập Tài Khoản & Kết Nối PC")


class PcMonitorApp:
    def __init__(self, root, api_base_url, token, user, devices):
        self.root = root
        self.api_base_url = api_base_url
        self.token = token
        self.user = user
        self.devices = devices
        self.selected_device = devices[0]
        self.device_code = self.selected_device["deviceCode"]

        self.root.title(f"LinhKien IoT·AI Monitor — {user.get('fullName', user.get('username'))}")
        self.root.geometry("460x500")
        self.root.minsize(440, 480)
        self.root.configure(bg="#0B0F19")

        self.sensor_reader = RealHardwareSensorReader()
        self.mqtt_topic_env = f"iot/environment/{self.device_code}"
        self.is_running = True
        self.mqtt_connected = False
        self.server_ok = True

        # Dữ liệu môi trường ngoài CHỈ lấy từ mạch ESP32 thật (không gán cứng 27.5°C)
        self.esp_last_seen = 0.0
        self.ambient_temp = 0.0
        self.ambient_humidity = 0.0
        self.dust_density = 0.0
        self.tick_count = 0

        self.client = mqtt.Client()
        self.client.on_connect = self.on_mqtt_connect
        self.client.on_disconnect = self.on_mqtt_disconnect
        self.client.on_message = self.on_mqtt_message

        self.create_widgets()
        self.start_mqtt_thread()
        self.update_telemetry_loop()

        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    def is_esp_active(self):
        return (time.time() - self.esp_last_seen) <= 15.0

    def on_mqtt_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.mqtt_connected = True
            self.client.subscribe(self.mqtt_topic_env)

    def on_mqtt_disconnect(self, client, userdata, rc):
        self.mqtt_connected = False

    def on_mqtt_message(self, client, userdata, msg):
        try:
            data = json.loads(msg.payload.decode("utf-8"))
            temp = data.get("ambientTemp") if data.get("ambientTemp") is not None else data.get("temperature")
            humidity = data.get("ambientHumidity") if data.get("ambientHumidity") is not None else data.get("humidity")
            dust = data.get("dustDensity") if data.get("dustDensity") is not None else data.get("dust")

            if temp is not None or humidity is not None or dust is not None:
                self.esp_last_seen = time.time()
                self.ambient_temp = round(float(temp), 1) if temp is not None else 0.0
                self.ambient_humidity = round(float(humidity), 1) if humidity is not None else 0.0
                self.dust_density = round(float(dust), 1) if dust is not None else 0.0
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
                old_topic = self.mqtt_topic_env
                self.selected_device = d
                self.device_code = d["deviceCode"]
                self.mqtt_topic_env = f"iot/environment/{self.device_code}"
                # Reset dữ liệu ESP32 của thiết bị cũ để không bị lẫn
                self.esp_last_seen = 0.0
                self.ambient_temp = 0.0
                self.ambient_humidity = 0.0
                self.dust_density = 0.0
                if self.mqtt_connected:
                    try:
                        self.client.unsubscribe(old_topic)
                        self.client.subscribe(self.mqtt_topic_env)
                    except Exception:
                        pass
                break

    def create_widgets(self):
        # 1. Header Bar
        header_frame = tk.Frame(self.root, bg="#111827", padx=12, pady=8)
        header_frame.pack(fill=tk.X, side=tk.TOP)

        tk.Label(
            header_frame,
            text="LINHKIEN IOT·AI AGENT",
            font=("Segoe UI", 10, "bold"),
            fg="#38BDF8",
            bg="#111827",
        ).pack(side=tk.LEFT)

        self.lbl_status = tk.Label(
            header_frame,
            text="● PC ONLINE",
            font=("Segoe UI", 9, "bold"),
            fg="#10B981",
            bg="#111827",
        )
        self.lbl_status.pack(side=tk.RIGHT)

        # 2. Account & Assigned Node Selector
        info_frame = tk.Frame(self.root, bg="#0F172A", padx=12, pady=8)
        info_frame.pack(fill=tk.X, padx=12, pady=(8, 0))

        tk.Label(
            info_frame,
            text=f"Tài khoản đã đăng nhập: {self.user.get('fullName')} (@{self.user.get('username')})",
            font=("Segoe UI", 8, "bold"),
            fg="#94A3B8",
            bg="#0F172A",
        ).pack(anchor="w")

        tk.Label(
            info_frame,
            text="Node PC được cấp trong tài khoản:",
            font=("Segoe UI", 8),
            fg="#64748B",
            bg="#0F172A",
        ).pack(anchor="w", pady=(2, 0))

        dev_names = [f"{d['deviceCode']} - {d['deviceName']}" for d in self.devices]
        self.device_var = tk.StringVar(value=dev_names[0])
        combo = ttk.Combobox(
            info_frame,
            textvariable=self.device_var,
            values=dev_names,
            state="readonly",
            font=("Segoe UI", 9, "bold"),
        )
        combo.pack(fill=tk.X, pady=(3, 2))
        combo.bind("<<ComboboxSelected>>", self.on_device_change)

        # 3. PC Real Hardware Metrics Box
        pc_box = tk.Frame(self.root, bg="#1F2937", bd=1, relief=tk.SOLID)
        pc_box.pack(fill=tk.BOTH, expand=True, padx=12, pady=(10, 6))

        pc_header = tk.Frame(pc_box, bg="#0F172A", padx=12, pady=6)
        pc_header.pack(fill=tk.X)
        tk.Label(
            pc_header,
            text="💻 DỮ LIỆU PHẦN CỨNG LẤY TRỰC TIẾP TỪ MÁY TÍNH (PC)",
            font=("Segoe UI", 8, "bold"),
            fg="#38BDF8",
            bg="#0F172A",
        ).pack(side=tk.LEFT)

        grid_frame = tk.Frame(pc_box, bg="#111827", padx=14, pady=10)
        grid_frame.pack(fill=tk.BOTH, expand=True)

        self.lbl_cpu = tk.Label(
            grid_frame,
            text="CPU Load: 0.0% (0 MHz)",
            font=("Segoe UI", 11, "bold"),
            fg="#38BDF8",
            bg="#111827",
            anchor="w",
        )
        self.lbl_cpu.pack(fill=tk.X, pady=3)

        self.lbl_ram = tk.Label(
            grid_frame,
            text="RAM thật: 0.0% (0.0 / 0.0 GB)",
            font=("Segoe UI", 11, "bold"),
            fg="#A855F7",
            bg="#111827",
            anchor="w",
        )
        self.lbl_ram.pack(fill=tk.X, pady=3)

        self.lbl_gpu = tk.Label(
            grid_frame,
            text="GPU Load: 0.0% | GPU Temp: 0.0°C",
            font=("Segoe UI", 10, "bold"),
            fg="#F43F5E",
            bg="#111827",
            anchor="w",
        )
        self.lbl_gpu.pack(fill=tk.X, pady=3)

        self.lbl_temp_fan = tk.Label(
            grid_frame,
            text="CPU Temp: 0.0°C | Quạt: 0 RPM | Công suất: 0 W",
            font=("Segoe UI", 9, "bold"),
            fg="#10B981",
            bg="#111827",
            anchor="w",
        )
        self.lbl_temp_fan.pack(fill=tk.X, pady=3)

        # 4. ESP32 External Sensor Status Box
        esp_box = tk.Frame(self.root, bg="#1F2937", bd=1, relief=tk.SOLID)
        esp_box.pack(fill=tk.X, padx=12, pady=(0, 12))

        esp_header = tk.Frame(esp_box, bg="#0F172A", padx=12, pady=6)
        esp_header.pack(fill=tk.X)
        tk.Label(
            esp_header,
            text="🌡️ MẠCH CẢM BIẾN MÔI TRƯỜNG NGOÀI (ESP32)",
            font=("Segoe UI", 8, "bold"),
            fg="#FBBF24",
            bg="#0F172A",
        ).pack(side=tk.LEFT)

        self.lbl_esp_state = tk.Label(
            esp_header,
            text="○ KHÔNG CÓ ESP32",
            font=("Segoe UI", 8, "bold"),
            fg="#F43F5E",
            bg="#0F172A",
        )
        self.lbl_esp_state.pack(side=tk.RIGHT)

        esp_body = tk.Frame(esp_box, bg="#161E2E", padx=14, pady=10)
        esp_body.pack(fill=tk.X)

        self.lbl_ambient = tk.Label(
            esp_body,
            text="Chưa kết nối mạch ESP32 (Nhiệt độ: 0°C | Độ ẩm: 0% | Bụi: 0 µg/m³)",
            font=("Segoe UI", 9, "bold"),
            fg="#94A3B8",
            bg="#161E2E",
            anchor="w",
        )
        self.lbl_ambient.pack(fill=tk.X)

    def send_to_server_async(self, payload):
        def _post():
            try:
                data_bytes = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(
                    f"{self.api_base_url}/iot/telemetry",
                    data=data_bytes,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.token}",
                    },
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    if resp.status == 200:
                        self.server_ok = True
            except Exception:
                self.server_ok = False

        threading.Thread(target=_post, daemon=True).start()

    def update_telemetry_loop(self):
        if not self.is_running:
            return

        try:
            hw = self.sensor_reader.get_snapshot()
            esp_active = self.is_esp_active()

            if not esp_active:
                amb_t = 0.0
                amb_h = 0.0
                dust_d = 0.0
            else:
                amb_t = self.ambient_temp
                amb_h = self.ambient_humidity
                dust_d = self.dust_density

            # Cập nhật thông số phần cứng thật từ máy tính
            self.lbl_cpu.config(
                text=f"CPU Load: {hw['cpuLoad']}% ({hw['cpuClockMhz']} MHz)"
            )
            self.lbl_ram.config(
                text=f"RAM thật: {hw['ramUsage']}% ({hw['ramUsedGb']} / {hw['ramTotalGb']} GB)"
            )
            gpu_temp_str = f"{hw['gpuTemp']}°C" if hw["gpuTemp"] > 0 else "0°C (Không có sensor)"
            self.lbl_gpu.config(
                text=f"GPU Load: {hw['gpuLoad']}%  |  GPU Temp: {gpu_temp_str}"
            )
            cpu_temp_str = f"{hw['cpuTemp']}°C" if hw["cpuTemp"] > 0 else "0°C (Không có sensor)"
            fan_str = f"{hw['fanSpeedRpm']} RPM" if hw["fanSpeedRpm"] > 0 else "0 RPM"
            pwr_str = f"{hw['powerDrawW']} W" if hw["powerDrawW"] > 0 else "0 W"
            self.lbl_temp_fan.config(
                text=f"CPU Temp: {cpu_temp_str}  |  Quạt: {fan_str}  |  Nguồn: {pwr_str}"
            )

            # Cập nhật trạng thái ESP32 rõ ràng (Đang hoạt động vs Không có ESP32)
            if esp_active:
                self.lbl_esp_state.config(text="● ESP32 ĐANG HOẠT ĐỘNG", fg="#10B981")
                self.lbl_ambient.config(
                    text=f"Nhiệt độ phòng: {amb_t}°C   |   Độ ẩm: {amb_h}%   |   Bụi: {dust_d} µg/m³",
                    fg="#FBBF24",
                )
            else:
                self.lbl_esp_state.config(text="○ KHÔNG CÓ ESP32 (OFFLINE)", fg="#F43F5E")
                self.lbl_ambient.config(
                    text=f"Chưa có tín hiệu từ mạch ESP32 ({self.mqtt_topic_env}) → Gửi 0°C / 0%",
                    fg="#94A3B8",
                )

            if self.server_ok:
                self.lbl_status.config(text=f"● PC ONLINE ({self.device_code})", fg="#10B981")
            else:
                self.lbl_status.config(text="● Mất kết nối Server", fg="#EF4444")

            self.tick_count += 1
            if self.tick_count % 2 == 0:
                payload = {
                    "deviceCode": self.device_code,
                    "cpuLoad": hw["cpuLoad"],
                    "cpuClockMhz": hw["cpuClockMhz"],
                    "cpuTemp": hw["cpuTemp"],
                    "ramUsage": hw["ramUsage"],
                    "ramUsedGb": hw["ramUsedGb"],
                    "ramTotalGb": hw["ramTotalGb"],
                    "gpuLoad": hw["gpuLoad"],
                    "gpuTemp": hw["gpuTemp"],
                    "fanSpeedRpm": hw["fanSpeedRpm"],
                    "powerDrawW": hw["powerDrawW"],
                    "ambientTemp": amb_t,
                    "ambientHumidity": amb_h,
                    "dustDensity": dust_d,
                }
                self.send_to_server_async(payload)

        except Exception:
            pass

        self.root.after(1000, self.update_telemetry_loop)

    def on_close(self):
        self.is_running = False
        self.sensor_reader.stop()
        try:
            self.client.loop_stop()
            self.client.disconnect()
        except Exception:
            pass
        self.root.destroy()


def main():
    login_root = tk.Tk()

    def launch_monitor(api_base_url, token, user, devices):
        login_root.destroy()
        app_root = tk.Tk()
        PcMonitorApp(app_root, api_base_url, token, user, devices)
        app_root.mainloop()

    LoginDialog(login_root, launch_monitor)
    login_root.mainloop()


if __name__ == "__main__":
    main()
