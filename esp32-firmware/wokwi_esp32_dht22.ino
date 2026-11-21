#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// 1. Cấu hình chân cảm biến DHT22 (GPIO 15) & Cảm biến bụi quang học / Biến trở giả lập (GPIO 34 ADC)
#define DHTPIN 15
#define DHTTYPE DHT22
#define DUST_PIN 34

DHT dht(DHTPIN, DHTTYPE);

// 2. Cấu hình WiFi ảo của Wokwi (Bắt buộc giữ nguyên tên này trên Wokwi)
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// 3. Cấu hình MQTT Broker công cộng miễn phí (HiveMQ)
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

// Topic chuẩn đồng bộ với Website và App Desktop
const char* mqtt_topic = "iot/environment/PC-NHAN-001";
const char* DEVICE_ID  = "PC-NHAN-001";

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;

void setup_wifi() {
  delay(10);
  Serial.println("Dang ket noi WiFi Wokwi-GUEST...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi da ket noi!");
  Serial.print("Dia chi IP: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Dang ket noi MQTT Broker...");
    String clientId = "ESP32_Wokwi_" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println(" Ket noi MQTT thanh cong!");
    } else {
      Serial.print(" Loi ket noi, rc=");
      Serial.print(client.state());
      Serial.println(" - Thu lai sau 3 giay");
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(DUST_PIN, INPUT);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Gui du lieu telemetry moi 2 giay
  unsigned long now = millis();
  if (now - lastMsg > 2000) {
    lastMsg = now;

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("Loi doc cam bien DHT22!");
      return;
    }

    // Doc cam bien bui (ADC 0..4095 -> quy doi 0..300 ug/m3)
    int rawDust = analogRead(DUST_PIN);
    float dustDensity = round((rawDust / 4095.0) * 300.0 * 10) / 10.0;

    // Dong goi goi tin JSON telemetry chuan do an
    StaticJsonDocument<256> doc;
    doc["deviceId"] = DEVICE_ID;
    doc["ambientTemp"] = round(temperature * 10) / 10.0;
    doc["ambientHumidity"] = round(humidity * 10) / 10.0;
    doc["dustDensity"] = dustDensity;
    doc["timestamp"] = millis();

    char buffer[256];
    serializeJson(doc, buffer);

    // Publish du lieu len MQTT
    client.publish(mqtt_topic, buffer);
    Serial.print("Da gui Telemetry len Web: ");
    Serial.println(buffer);
  }
}
