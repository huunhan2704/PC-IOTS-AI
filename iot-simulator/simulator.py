"""
IoT Simulator - ỨNG DỤNG IOTS VÀ AI VÀO HỆ THỐNG WEB BÁN LINH KIỆN MÁY TÍNH
Tác giả: Trần Hữu Nhân - Khoa CNTT, ĐH Tài nguyên và Môi trường TP.HCM

Giả lập đồng thời:
  * PC Agent  -> publish  pc/telemetry/{deviceId}   (CPU, RAM, GPU, Fan, Power)
  * ESP32     -> publish  iot/environment/{deviceId} (DHT22: nhiệt độ, độ ẩm phòng)
  * Cảnh báo  -> publish  pc/alerts/{deviceId}       (FAN_FAILURE ngẫu nhiên khi stress)
  * Điều khiển<- subscribe pc/control/{deviceId}     ({"scenario": "IDLE|GAMING|STRESS|STOP"})

Kịch bản:
  IDLE   : CPU ~5%,   42°C, phòng 28°C
  GAMING : CPU ~65%,  72°C, GPU ~95%, phòng 30°C
  STRESS : CPU 100%,  92°C, quạt 100%, phòng 41°C  -> kích hoạt báo động BR09/BR10

Ví dụ:
  python simulator.py
  python simulator.py --devices PC-NHAN-001,PC-LAB-002 --scenario GAMING --interval 2
  python simulator.py --host localhost --port 1883 --cycle   (tự xoay vòng kịch bản mỗi 60s)
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import random
import signal
import sys
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime

import paho.mqtt.client as mqtt

# Windows console mặc định cp1252 -> ép UTF-8 để in tiếng Việt / emoji không lỗi
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("iot-simulator")

SCENARIOS = ("IDLE", "GAMING", "STRESS", "STOP")

# Mục tiêu (target) cho từng kịch bản. Giá trị thực tế sẽ "trôi" dần về target + nhiễu.
PROFILES = {
    "IDLE": dict(cpu_load=5, cpu_temp=42, cpu_clock=1200, ram_usage=38, gpu_load=3,
                 gpu_temp=38, fan_pct=30, power=85, ambient=28, humidity=60),
    "GAMING": dict(cpu_load=65, cpu_temp=72, cpu_clock=4400, ram_usage=78, gpu_load=95,
                   gpu_temp=70, fan_pct=65, power=330, ambient=30, humidity=62),
    "STRESS": dict(cpu_load=100, cpu_temp=92, cpu_clock=3600, ram_usage=93, gpu_load=99,
                   gpu_temp=89, fan_pct=100, power=520, ambient=41, humidity=55),
}

NOISE = dict(cpu_load=3, cpu_temp=1.2, cpu_clock=120, ram_usage=1.5, gpu_load=2.5,
             gpu_temp=1.0, fan_pct=2, power=15, ambient=0.3, humidity=1.0)

FAN_MAX_RPM = 2600
RAM_TOTAL_GB = 16.0


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


@dataclass
class DeviceState:
    device_id: str
    scenario: str = "IDLE"
    esp32_ip: str = field(default_factory=lambda: f"192.168.1.{random.randint(20, 220)}")
    values: dict = field(default_factory=lambda: dict(PROFILES["IDLE"]))

    def step(self) -> None:
        """Di chuyển giá trị hiện tại về target của kịch bản (làm mượt ~25%/chu kỳ) + nhiễu."""
        if self.scenario == "STOP":
            return
        target = PROFILES[self.scenario]
        for key, tgt in target.items():
            cur = self.values[key]
            nxt = cur + (tgt - cur) * 0.25 + random.uniform(-NOISE[key], NOISE[key])
            self.values[key] = nxt

    def telemetry_payload(self) -> dict:
        v = self.values
        cpu_load = clamp(v["cpu_load"], 0, 100)
        cpu_temp = clamp(v["cpu_temp"], 25, 105)
        # Thermal throttling: nhiệt > 88°C thì xung nhịp sụt
        clock = v["cpu_clock"]
        if cpu_temp > 88:
            clock -= (cpu_temp - 88) * 120
        ram_usage = clamp(v["ram_usage"], 5, 99.5)
        fan_pct = clamp(v["fan_pct"], 0, 100)
        return {
            "cpu_load": round(cpu_load, 1),
            "cpu_temp": round(cpu_temp, 1),
            "cpu_clock_mhz": int(clamp(clock, 800, 5800)),
            "ram_usage": round(ram_usage, 1),
            "ram_used_gb": round(RAM_TOTAL_GB * ram_usage / 100, 2),
            "ram_total_gb": RAM_TOTAL_GB,
            "gpu_load": round(clamp(v["gpu_load"], 0, 100), 1),
            "gpu_temp": round(clamp(v["gpu_temp"], 25, 100), 1),
            "fan_speed_rpm": int(FAN_MAX_RPM * fan_pct / 100),
            "power_draw_w": int(clamp(v["power"], 40, 900)),
            "timestamp": datetime.now().isoformat(timespec="seconds"),
        }

    def environment_payload(self) -> dict:
        return {
            "temperature": round(clamp(self.values["ambient"], 10, 55), 1),
            "humidity": round(clamp(self.values["humidity"], 20, 95), 1),
            "esp32_ip": self.esp32_ip,
            "timestamp": datetime.now().isoformat(timespec="seconds"),
        }


class Simulator:
    def __init__(self, host: str, port: int, devices: list[str], scenario: str,
                 interval: float, cycle: bool) -> None:
        self.host = host
        self.port = port
        self.interval = interval
        self.cycle = cycle
        self.devices = {d: DeviceState(d, scenario) for d in devices}
        self.stop_event = threading.Event()
        self.lock = threading.Lock()
        self.client = self._build_client()

    # ------------------------------------------------------------------ MQTT
    def _build_client(self) -> mqtt.Client:
        client_id = f"linhkien-sim-{random.randint(1000, 9999)}"
        try:  # paho-mqtt >= 2.0
            client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
        except AttributeError:  # paho-mqtt 1.x
            client = mqtt.Client(client_id=client_id)
        client.on_connect = self._on_connect
        client.on_disconnect = self._on_disconnect
        client.on_message = self._on_message
        client.reconnect_delay_set(min_delay=1, max_delay=10)
        return client

    def _on_connect(self, client, userdata, flags, reason_code, properties=None):
        log.info("Đã kết nối MQTT broker %s:%s (rc=%s)", self.host, self.port, reason_code)
        for dev in self.devices:
            client.subscribe(f"pc/control/{dev}", qos=1)
        log.info("Lắng nghe lệnh điều khiển: pc/control/{%s}", ",".join(self.devices))

    def _on_disconnect(self, client, userdata, *args):
        log.warning("Mất kết nối MQTT, đang tự động kết nối lại...")

    def _on_message(self, client, userdata, msg):
        device_id = msg.topic.rsplit("/", 1)[-1]
        try:
            data = json.loads(msg.payload.decode("utf-8"))
            scenario = str(data.get("scenario", "")).upper()
        except (ValueError, UnicodeDecodeError):
            log.error("Lệnh điều khiển không hợp lệ: %s", msg.payload)
            return
        if scenario not in SCENARIOS:
            log.error("Kịch bản không hỗ trợ: %s", scenario)
            return
        with self.lock:
            if device_id in self.devices:
                self.devices[device_id].scenario = scenario
                log.info(">>> [%s] chuyển kịch bản -> %s", device_id, scenario)

    # ------------------------------------------------------------------ loop
    def _publish(self, topic: str, payload: dict) -> None:
        self.client.publish(topic, json.dumps(payload), qos=0)

    def _tick(self) -> None:
        with self.lock:
            states = list(self.devices.values())
        for st in states:
            if st.scenario == "STOP":
                continue
            st.step()
            tel = st.telemetry_payload()
            env = st.environment_payload()
            self._publish(f"pc/telemetry/{st.device_id}", tel)
            self._publish(f"iot/environment/{st.device_id}", env)

            flag = ""
            if tel["cpu_temp"] > 85 or tel["gpu_temp"] > 85:
                flag = "  🔥 QUÁ NHIỆT"
            if env["temperature"] > 40:
                flag += "  🌡️ PHÒNG NÓNG"
            log.info("[%s|%-6s] CPU %5.1f%% %5.1f°C | GPU %5.1f%% %5.1f°C | RAM %5.1f%% | "
                     "Fan %4d rpm | %3dW | Phòng %4.1f°C %4.1f%%%s",
                     st.device_id, st.scenario, tel["cpu_load"], tel["cpu_temp"],
                     tel["gpu_load"], tel["gpu_temp"], tel["ram_usage"], tel["fan_speed_rpm"],
                     tel["power_draw_w"], env["temperature"], env["humidity"], flag)

            # Thỉnh thoảng giả lập lỗi quạt khi stress test (5%)
            if st.scenario == "STRESS" and random.random() < 0.05:
                self._publish(f"pc/alerts/{st.device_id}", {
                    "type": "FAN_FAILURE",
                    "message": "Quạt tản nhiệt CPU quay bất thường / dừng quay",
                    "value": 0,
                })
                log.warning("[%s] Gửi cảnh báo FAN_FAILURE", st.device_id)

    def _cycle_thread(self) -> None:
        order = ["IDLE", "GAMING", "STRESS"]
        idx = 0
        while not self.stop_event.wait(60):
            idx = (idx + 1) % len(order)
            with self.lock:
                for st in self.devices.values():
                    st.scenario = order[idx]
            log.info("=== Tự động xoay vòng kịch bản -> %s ===", order[idx])

    def run(self) -> None:
        log.info("Kết nối tới MQTT broker %s:%s ...", self.host, self.port)
        while not self.stop_event.is_set():
            try:
                self.client.connect(self.host, self.port, keepalive=30)
                break
            except OSError as exc:
                log.error("Không kết nối được broker (%s). Thử lại sau 3s...", exc)
                time.sleep(3)
        self.client.loop_start()
        if self.cycle:
            threading.Thread(target=self._cycle_thread, daemon=True).start()
        try:
            while not self.stop_event.is_set():
                self._tick()
                self.stop_event.wait(self.interval)
        finally:
            self.client.loop_stop()
            self.client.disconnect()
            log.info("Đã dừng simulator.")

    def stop(self, *_):
        self.stop_event.set()


def main() -> None:
    parser = argparse.ArgumentParser(description="Giả lập PC Agent + ESP32 gửi dữ liệu MQTT")
    parser.add_argument("--host", default=os.getenv("MQTT_HOST", "localhost"))
    parser.add_argument("--port", type=int, default=int(os.getenv("MQTT_PORT", "1883")))
    parser.add_argument("--devices", default=os.getenv("DEVICES", "PC-NHAN-001,PC-LAB-002"),
                        help="Danh sách deviceCode, phân tách bằng dấu phẩy")
    parser.add_argument("--scenario", default=os.getenv("SCENARIO", "IDLE"), choices=SCENARIOS)
    parser.add_argument("--interval", type=float, default=float(os.getenv("INTERVAL", "2")))
    parser.add_argument("--cycle", action="store_true",
                        default=os.getenv("CYCLE", "false").lower() == "true",
                        help="Tự xoay vòng IDLE -> GAMING -> STRESS mỗi 60 giây")
    args = parser.parse_args()

    devices = [d.strip() for d in args.devices.split(",") if d.strip()]
    sim = Simulator(args.host, args.port, devices, args.scenario, args.interval, args.cycle)
    signal.signal(signal.SIGINT, sim.stop)
    signal.signal(signal.SIGTERM, sim.stop)
    sim.run()


if __name__ == "__main__":
    sys.exit(main())
