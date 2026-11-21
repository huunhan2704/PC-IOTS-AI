package com.linhkien.iotai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.linhkien.iotai.dto.iot.IotDto;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class MqttSubscriberService implements MqttCallback {

    private final IotTelemetryService telemetryService;
    private final ObjectMapper objectMapper;

    @Value("${app.mqtt.enabled:false}")
    private boolean mqttEnabled;

    @Value("${app.mqtt.broker-url:tcp://localhost:1883}")
    private String brokerUrl;

    @Value("${app.mqtt.client-id:linhkien-backend-subscriber}")
    private String clientId;

    private MqttClient client;

    // Cache latest environment data from ESP32: deviceId -> {temperature, humidity, esp32_ip}
    private final Map<String, Map<String, Object>> latestEnvData = new ConcurrentHashMap<>();
    private final Map<String, Long> realPcLastStreamMap = new ConcurrentHashMap<>();

    @PostConstruct
    public void start() {
        if (!mqttEnabled) {
            log.info("MQTT Client is disabled in application settings (using internal simulator).");
            return;
        }

        try {
            client = new MqttClient(brokerUrl, clientId + "-" + System.currentTimeMillis(), new MemoryPersistence());
            MqttConnectOptions options = new MqttConnectOptions();
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            options.setConnectionTimeout(10);
            client.setCallback(this);

            client.connect(options);
            log.info("Connected to Mosquitto MQTT broker at {}", brokerUrl);

            // Subscribe topics
            client.subscribe("pc/telemetry/#", 1);
            client.subscribe("iot/environment/#", 1);
            client.subscribe("pc/alerts/#", 1);

        } catch (MqttException e) {
            log.warn("Could not connect to Mosquitto broker: {}. Falling back to internal simulator.", e.getMessage());
        }
    }

    @PreDestroy
    public void stop() {
        if (client != null && client.isConnected()) {
            try {
                client.disconnect();
                client.close();
            } catch (Exception ignored) {}
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.warn("MQTT connection lost: {}", cause != null ? cause.getMessage() : "Unknown");
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String payload = new String(message.getPayload(), StandardCharsets.UTF_8);

        try {
            if (topic.startsWith("iot/environment/")) {
                String rawDeviceId = topic.substring("iot/environment/".length()).trim().toUpperCase();
                // Map ESP32_ROOM_01 to PC-NHAN-001 or keep raw
                String deviceId = "ESP32_ROOM_01".equalsIgnoreCase(rawDeviceId) ? "PC-NHAN-001" : rawDeviceId;

                Map<String, Object> envMap = objectMapper.readValue(payload, Map.class);
                latestEnvData.put(deviceId, envMap);
                log.info("Received environment telemetry from ESP32 for {}: {}", deviceId, payload);

            } else if (topic.startsWith("pc/telemetry/")) {
                String rawDeviceId = topic.substring("pc/telemetry/".length()).trim().toUpperCase();
                String deviceId = ("PC_GAMING_NHAN".equalsIgnoreCase(rawDeviceId) || "PC_GAMING".equalsIgnoreCase(rawDeviceId)) ? "PC-NHAN-001" : rawDeviceId;

                Map<String, Object> telemMap = objectMapper.readValue(payload, Map.class);

                // Merge environment data if present
                Map<String, Object> env = latestEnvData.getOrDefault(deviceId, Collections.emptyMap());
                float ambTemp = 28.0f;
                if (env.containsKey("ambientTemp")) {
                    ambTemp = ((Number) env.get("ambientTemp")).floatValue();
                } else if (env.containsKey("temperature")) {
                    ambTemp = ((Number) env.get("temperature")).floatValue();
                }

                float ambHum = 60.0f;
                if (env.containsKey("ambientHumidity")) {
                    ambHum = ((Number) env.get("ambientHumidity")).floatValue();
                } else if (env.containsKey("humidity")) {
                    ambHum = ((Number) env.get("humidity")).floatValue();
                }

                float dustDensity = 25.0f;
                if (env.containsKey("dustDensity")) {
                    dustDensity = ((Number) env.get("dustDensity")).floatValue();
                } else if (env.containsKey("dust")) {
                    dustDensity = ((Number) env.get("dust")).floatValue();
                } else if (env.containsKey("pm25")) {
                    dustDensity = ((Number) env.get("pm25")).floatValue();
                }

                // Support both camelCase (from python script) and snake_case (standard)
                float cpuLoad = getFloat(telemMap, "cpuLoad", "cpu_load", 0.0f);
                float cpuTemp = getFloat(telemMap, "cpuTemp", "cpu_temp", 42.0f);
                int cpuFreq = getInt(telemMap, "cpuFreq", "cpu_clock_mhz", 3600);
                float ramUsage = getFloat(telemMap, "ramUsage", "ram_usage", 45.0f);
                float ramUsedGb = getFloat(telemMap, "ramUsedGb", "ram_used_gb", 7.2f);
                float ramTotalGb = getFloat(telemMap, "ramTotalGb", "ram_total_gb", 16.0f);
                float gpuLoad = getFloat(telemMap, "gpuLoad", "gpu_load", 5.0f);
                float gpuTemp = getFloat(telemMap, "gpuTemp", "gpu_temp", 40.0f);
                int fanRpm = getInt(telemMap, "fanRpm", "fan_speed_rpm", 1100);
                int powerW = getInt(telemMap, "powerDrawW", "power_draw_w", 120);

                IotDto.TelemetryResponse telem = IotDto.TelemetryResponse.builder()
                        .deviceCode(deviceId)
                        .cpuLoad(cpuLoad)
                        .cpuTemp(cpuTemp)
                        .cpuClockMhz(cpuFreq)
                        .ramUsage(ramUsage)
                        .ramUsedGb(ramUsedGb)
                        .ramTotalGb(ramTotalGb)
                        .gpuLoad(gpuLoad)
                        .gpuTemp(gpuTemp)
                        .fanSpeedRpm(fanRpm)
                        .powerDrawW(powerW)
                        .ambientTemp(ambTemp)
                        .ambientHumidity(ambHum)
                        .dustDensity(dustDensity)
                        .build();

                realPcLastStreamMap.put(deviceId, System.currentTimeMillis());
                telemetryService.processTelemetry(deviceId, telem);
            }
        } catch (Exception e) {
            log.error("Failed to process MQTT message on {}: {}", topic, e.getMessage());
        }
    }

    public boolean isRealPcStreaming(String deviceId) {
        Long lastTime = realPcLastStreamMap.get(deviceId);
        return lastTime != null && (System.currentTimeMillis() - lastTime < 10000);
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
    }

    private float getFloat(Map<String, Object> map, String key1, String key2, float defaultVal) {
        if (map.containsKey(key1)) return ((Number) map.get(key1)).floatValue();
        if (map.containsKey(key2)) return ((Number) map.get(key2)).floatValue();
        return defaultVal;
    }

    private int getInt(Map<String, Object> map, String key1, String key2, int defaultVal) {
        if (map.containsKey(key1)) return ((Number) map.get(key1)).intValue();
        if (map.containsKey(key2)) return ((Number) map.get(key2)).intValue();
        return defaultVal;
    }

    public Map<String, Object> getLatestAmbientData(String deviceId) {
        return latestEnvData.get(deviceId);
    }

    public void publishControlCommand(String deviceId, String scenario) {
        if (client != null && client.isConnected()) {
            try {
                String topic = "pc/control/" + deviceId;
                String payload = "{\"scenario\":\"" + scenario + "\"}";
                client.publish(topic, new MqttMessage(payload.getBytes(StandardCharsets.UTF_8)));
            } catch (Exception e) {
                log.warn("Failed to publish MQTT control message: {}", e.getMessage());
            }
        }
    }
}
