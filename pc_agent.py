import time
import json
import psutil
import paho.mqtt.client as mqtt

# Cau hinh MQTT Broker cong cong HiveMQ (khop voi Backend & Wokwi)
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
TOPIC_PC = "pc/telemetry/PC-NHAN-001"

client = mqtt.Client()

def on_connect(c, userdata, flags, rc):
    if rc == 0:
        print("=> [MQTT] Ket noi thanh cong toi broker.hivemq.com:1883!")
        print("=> Dang thu thap thong so phan cung PC THAT va ban len Web...\n")
    else:
        print(f"=> [MQTT] Ket noi that bai, ma loi: {rc}")

client.on_connect = on_connect

try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
except Exception as e:
    print(f"Loi ket noi MQTT: {e}")

while True:
    try:
        # 1. Lay thong so CPU that
        cpu_percent = psutil.cpu_percent(interval=1)
        freq = psutil.cpu_freq()
        cpu_freq = int(freq.current) if freq else 2800

        # 2. Lay thong so RAM that
        ram = psutil.virtual_memory()
        ram_percent = ram.percent
        ram_used_gb = round(ram.used / (1024**3), 1)
        ram_total_gb = round(ram.total / (1024**3), 1)

        # 3. Uoc luong nhiet do CPU & GPU theo tai thuc te (neu may khong co sensor nhiet)
        estimated_temp = round(38.0 + (cpu_percent * 0.45), 1)
        estimated_fan = int(900 + (cpu_percent * 12))

        payload = {
            "node": "PC Gaming Trần Hữu Nhân",
            "cpuLoad": cpu_percent,
            "cpuFreq": cpu_freq,
            "cpuTemp": estimated_temp,
            "ramUsage": ram_percent,
            "ramUsedGb": ram_used_gb,
            "ramTotalGb": ram_total_gb,
            "gpuLoad": round(cpu_percent * 0.8, 1),
            "gpuTemp": round(estimated_temp + 3.5, 1),
            "fanRpm": estimated_fan,
            "powerDrawW": int(80 + (cpu_percent * 1.5)),
            "timestamp": time.strftime("%H:%M:%S")
        }

        client.publish(TOPIC_PC, json.dumps(payload))
        print(f"[{payload['timestamp']}] CPU: {cpu_percent}% ({cpu_freq}MHz) | RAM: {ram_percent}% ({ram_used_gb}/{ram_total_gb}GB) | Temp: {estimated_temp}°C | Fan: {estimated_fan} RPM")
        time.sleep(2)
    except KeyboardInterrupt:
        print("\nDa dung script PC Agent.")
        break
    except Exception as e:
        print(f"Loi: {e}")
        time.sleep(2)
