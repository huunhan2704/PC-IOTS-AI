/*
 * ==============================================================================
 * ĐỒ ÁN TỐT NGHIỆP: ỨNG DỤNG IOTS VÀ AI VÀO HỆ THỐNG WEB BÁN LINH KIỆN MÁY TÍNH
 * Tác giả: Trần Hữu Nhân (Khoa CNTT - HCMUNRE) - GVHD: ThS. Nguyễn Thanh Truyền
 * Mã nguồn vi điều khiển ESP32 + Cảm biến DHT11 / DHT22 (Nhiệt độ & Độ ẩm phòng)
 * Giao thức truyền thông: MQTT (WiFiClient)
 * ==============================================================================
 * 
 * SƠ ĐỒ CHÂN KẾT NỐI (WIRING):
 *   - ESP32 3V3 (hoặc 5V) -> DHT22 Pin VCC (hoặc Pin 1)
 *   - ESP32 GND          -> DHT22 Pin GND (hoặc Pin 4)
 *   - ESP32 GPIO 4       -> DHT22 Pin DATA (hoặc Pin 2)
 *   (Ghi chú: Nên gắn thêm 1 điện trở kéo lên 10k giữa VCC và DATA nếu module chưa có)
 * 
 * THƯ VIỆN CẦN CÀI ĐẶT TRÊN ARDUINO IDE:
 *   1. "DHT sensor library" by Adafruit
 *   2. "Adafruit Unified Sensor" by Adafruit
 *   3. "PubSubClient" by Nick O'Leary
 *   4. "ArduinoJson" by Benoit Blanchon (phiên bản 6.x hoặc 7.x)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ---------------------- 1. CẤU HÌNH WIFI ----------------------
const char* WIFI_SSID     = "TEN_WIFI_NHA_BAN";      // <-- Thay bằng tên Wifi của bạn
const char* WIFI_PASSWORD = "MAT_KHAU_WIFI";        // <-- Thay bằng mật khẩu Wifi

// ---------------------- 2. CẤU HÌNH MQTT BROKER ----------------------
// Địa chỉ IP của máy tính đang chạy Mosquitto Broker trong cùng mạng Wifi
const char* MQTT_BROKER   = "192.168.2.76";          // <-- Địa chỉ IP máy tính của bạn
const int   MQTT_PORT     = 1883;
const char* MQTT_USER     = "";                      // Để trống nếu anonymous
const char* MQTT_PASS     = "";

// Topic MQTT theo hợp đồng kỹ thuật CONTRACT.md của đồ án:
// Topic: iot/environment/{deviceCode}
const char* DEVICE_CODE   = "PC-NHAN-001";           // Khớp với mã máy tính của bạn
const char* MQTT_TOPIC    = "iot/environment/PC-NHAN-001";

// ---------------------- 3. CẤU HÌNH CẢM BIẾN DHT ----------------------
#define DHTPIN  4           // Chân GPIO 4 trên ESP32 nối chân DATA của DHT
#define DHTTYPE DHT22       // Nếu dùng DHT11 thì đổi thành DHT11

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
const long interval = 2000; // Gửi dữ liệu mỗi 2 giây / lần (2000ms)

void setupWifi() {
  delay(10);
  Serial.println();
  Serial.print("Dang ket noi toi Wifi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("=> WiFi da ket noi thanh cong!");
  Serial.print("=> Dia chi IP cua ESP32: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Dang ket noi toi MQTT Broker tai ");
    Serial.print(MQTT_BROKER);
    Serial.print("...");

    String clientId = "ESP32-DHT-" + String(DEVICE_CODE);
    if (client.connect(clientId.c_str())) {
      Serial.println(" THANH CONG!");
    } else {
      Serial.print(" That bai, ma loi rc=");
      Serial.print(client.state());
      Serial.println(". Thu lai sau 3 giay...");
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("==============================================");
  Serial.println("ESP32 IoT Node - Phong may linh kien PC");
  Serial.println("De tai: Ung dung IoT & AI - Tran Huu Nhan");
  Serial.println("==============================================");

  dht.begin();
  setupWifi();
  client.setServer(MQTT_BROKER, MQTT_PORT);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;

    // Đọc nhiệt độ và độ ẩm từ cảm biến
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature(); // Nhiệt độ độ C

    // Kiểm tra cảm biến có hoạt động tốt không
    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("[LOI] Khong the doc du lieu tu cam bien DHT!");
      return;
    }

    // Đóng gói JSON payload theo đúng CONTRACT.md
    StaticJsonDocument<200> doc;
    doc["temperature"] = serialized(String(temperature, 1));
    doc["humidity"]    = serialized(String(humidity, 1));
    doc["esp32_ip"]     = WiFi.localIP().toString();

    char jsonBuffer[256];
    serializeJson(doc, jsonBuffer);

    // Bắn dữ liệu lên MQTT Broker
    boolean success = client.publish(MQTT_TOPIC, jsonBuffer);

    if (success) {
      Serial.print("[MQTT GUI] Topic: ");
      Serial.print(MQTT_TOPIC);
      Serial.print(" => Data: ");
      Serial.println(jsonBuffer);
    } else {
      Serial.println("[LOI] Publish MQTT that bai!");
    }
  }
}
