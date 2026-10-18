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
                String deviceId = topic.substring("iot/environment/".length());
                Map<String, Object> envMap = objectMapper.readValue(payload, Map.class);
                latestEnvData.put(deviceId, envMap);

            } else if (topic.startsWith("pc/telemetry/")) {
                String deviceId = topic.substring("pc/telemetry/".length());
                Map<String, Object> telemMap = objectMapper.readValue(payload, Map.class);

                // Merge environment data if present
                Map<String, Object> env = latestEnvData.getOrDefault(deviceId, Collections.emptyMap());
                float ambTemp = env.containsKey("temperature") ? ((Number) env.get("temperature")).floatValue() : 28.0f;
                float ambHum = env.containsKey("humidity") ? ((Number) env.get("humidity")).floatValue() : 60.0f;

                IotDto.TelemetryResponse telem = IotDto.TelemetryResponse.builder()
                        .deviceCode(deviceId)
                        .cpuLoad(telemMap.containsKey("cpu_load") ? ((Number) telemMap.get("cpu_load")).floatValue() : 0.0f)
                        .cpuTemp(telemMap.containsKey("cpu_temp") ? ((Number) telemMap.get("cpu_temp")).floatValue() : 0.0f)
                        .cpuClockMhz(telemMap.containsKey("cpu_clock_mhz") ? ((Number) telemMap.get("cpu_clock_mhz")).intValue() : 3600)
                        .ramUsage(telemMap.containsKey("ram_usage") ? ((Number) telemMap.get("ram_usage")).floatValue() : 0.0f)
                        .ramUsedGb(telemMap.containsKey("ram_used_gb") ? ((Number) telemMap.get("ram_used_gb")).floatValue() : 0.0f)
                        .ramTotalGb(telemMap.containsKey("ram_total_gb") ? ((Number) telemMap.get("ram_total_gb")).floatValue() : 16.0f)
                        .gpuLoad(telemMap.containsKey("gpu_load") ? ((Number) telemMap.get("gpu_load")).floatValue() : 0.0f)
                        .gpuTemp(telemMap.containsKey("gpu_temp") ? ((Number) telemMap.get("gpu_temp")).floatValue() : 0.0f)
                        .fanSpeedRpm(telemMap.containsKey("fan_speed_rpm") ? ((Number) telemMap.get("fan_speed_rpm")).intValue() : 1200)
                        .powerDrawW(telemMap.containsKey("power_draw_w") ? ((Number) telemMap.get("power_draw_w")).intValue() : 150)
                        .ambientTemp(ambTemp)
                        .ambientHumidity(ambHum)
                        .build();

                telemetryService.processTelemetry(deviceId, telem);
            }
        } catch (Exception e) {
            log.error("Failed to process MQTT message on {}: {}", topic, e.getMessage());
        }
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
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
