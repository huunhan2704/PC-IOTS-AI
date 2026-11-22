package com.linhkien.iotai.service;

import com.linhkien.iotai.dto.iot.IotDto;
import com.linhkien.iotai.entity.IotDevice;
import com.linhkien.iotai.repository.IotDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class InternalSimulatorService {

    private final IotDeviceRepository deviceRepository;
    private final IotTelemetryService telemetryService;
    private final MqttSubscriberService mqttSubscriberService;

    @Value("${app.simulator.internal-enabled:true}")
    private boolean simulatorEnabled;

    private final ConcurrentHashMap<String, String> scenarioMap = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public void setScenario(String deviceCode, String scenario) {
        String upper = scenario != null ? scenario.trim().toUpperCase() : "STOP";
        scenarioMap.put(deviceCode, upper);
        deviceRepository.findByDeviceCode(deviceCode).ifPresent(d -> {
            d.setCurrentScenario(upper);
            if ("STOP".equalsIgnoreCase(upper) && !mqttSubscriberService.isRealPcStreaming(deviceCode)) {
                d.setStatus(com.linhkien.iotai.entity.enums.DeviceStatus.OFFLINE);
            }
            deviceRepository.save(d);
        });
    }

    public void stopSimulation(String deviceCode) {
        if (deviceCode != null) {
            scenarioMap.put(deviceCode.trim().toUpperCase(), "STOP");
        }
    }

    public String getScenario(String deviceCode) {
        return scenarioMap.getOrDefault(deviceCode, "STOP");
    }

    @Scheduled(fixedRateString = "${app.simulator.interval-ms:2000}")
    public void generateSimulatedTelemetry() {
        List<IotDevice> devices = deviceRepository.findAll();
        for (IotDevice dev : devices) {
            String code = dev.getDeviceCode();
            // Chỉ chạy giả lập khi người dùng chủ động bấm chọn kịch bản (IDLE/GAMING/STRESS) trên thanh công cụ
            String sc = scenarioMap.get(code);
            if (sc == null) {
                if (!simulatorEnabled) {
                    continue;
                }
                sc = dev.getCurrentScenario() != null ? dev.getCurrentScenario() : "STOP";
            }

            if ("STOP".equalsIgnoreCase(sc)) {
                continue;
            }

            // If real PC agent is actively publishing within last 10s, pause simulator
            if (mqttSubscriberService.isRealPcStreaming(code)) {
                continue;
            }

            IotDto.TelemetryResponse telem = simulateMetrics(code, sc);
            try {
                telemetryService.processTelemetry(code, telem);
            } catch (Exception e) {
                log.error("Internal simulation push failed for {}: {}", code, e.getMessage());
            }
        }
    }

    private IotDto.TelemetryResponse simulateMetrics(String deviceCode, String scenario) {
        float cpuLoad, cpuTemp, ramUsage, ramUsedGb, gpuLoad, gpuTemp, ambTemp, ambHum;
        int fanRpm, clockMhz, powerW;

        switch (scenario.toUpperCase()) {
            case "GAMING":
                cpuLoad = 60.0f + random.nextFloat() * 20.0f; // 60 - 80%
                cpuTemp = 68.0f + random.nextFloat() * 8.0f;  // 68 - 76°C
                ramUsage = 70.0f + random.nextFloat() * 15.0f;// 70 - 85%
                ramUsedGb = (ramUsage / 100.0f) * 16.0f;
                gpuLoad = 90.0f + random.nextFloat() * 9.0f;  // 90 - 99%
                gpuTemp = 72.0f + random.nextFloat() * 6.0f;  // 72 - 78°C
                fanRpm = 1800 + random.nextInt(400);
                clockMhz = 4400 + random.nextInt(400);
                powerW = 320 + random.nextInt(60);
                ambTemp = 28.0f + random.nextFloat() * 3.0f;
                ambHum = 58.0f + random.nextFloat() * 6.0f;
                break;

            case "STRESS":
                cpuLoad = 96.0f + random.nextFloat() * 4.0f; // 96 - 100%
                cpuTemp = 87.0f + random.nextFloat() * 6.0f; // 87 - 93°C (Triggers BR09 Overheat!)
                ramUsage = 90.0f + random.nextFloat() * 8.0f;// 90 - 98% (Triggers BR11 RAM Bottleneck!)
                ramUsedGb = (ramUsage / 100.0f) * 16.0f;
                gpuLoad = 95.0f + random.nextFloat() * 5.0f;
                gpuTemp = 86.0f + random.nextFloat() * 4.0f; // >85°C
                fanRpm = 2500 + random.nextInt(200);         // Max speed
                clockMhz = 4800 + random.nextInt(200);
                powerW = 420 + random.nextInt(50);
                ambTemp = 40.5f + random.nextFloat() * 2.0f; // >40°C (Triggers BR10 Ambient Heat!)
                ambHum = 48.0f + random.nextFloat() * 5.0f;
                break;

            case "IDLE":
            default:
                cpuLoad = 3.0f + random.nextFloat() * 8.0f;   // 3 - 11%
                cpuTemp = 38.0f + random.nextFloat() * 6.0f;  // 38 - 44°C
                ramUsage = 35.0f + random.nextFloat() * 10.0f;// 35 - 45%
                ramUsedGb = (ramUsage / 100.0f) * 16.0f;
                gpuLoad = 2.0f + random.nextFloat() * 5.0f;
                gpuTemp = 40.0f + random.nextFloat() * 4.0f;
                fanRpm = 950 + random.nextInt(150);
                clockMhz = 2400 + random.nextInt(600);
                powerW = 65 + random.nextInt(20);
                ambTemp = 27.0f + random.nextFloat() * 2.0f;
                ambHum = 65.0f + random.nextFloat() * 5.0f;
                break;
        }

        // Check if real ESP32 sent environment data via MQTT
        float dustDensity = 22.0f + random.nextFloat() * 12.0f;
        Map<String, Object> realEnv = mqttSubscriberService.getLatestAmbientData(deviceCode);
        if (realEnv != null) {
            if (realEnv.containsKey("ambientTemp")) {
                ambTemp = ((Number) realEnv.get("ambientTemp")).floatValue();
            } else if (realEnv.containsKey("temperature")) {
                ambTemp = ((Number) realEnv.get("temperature")).floatValue();
            }
            if (realEnv.containsKey("ambientHumidity")) {
                ambHum = ((Number) realEnv.get("ambientHumidity")).floatValue();
            } else if (realEnv.containsKey("humidity")) {
                ambHum = ((Number) realEnv.get("humidity")).floatValue();
            }
            if (realEnv.containsKey("dustDensity")) {
                dustDensity = ((Number) realEnv.get("dustDensity")).floatValue();
            } else if (realEnv.containsKey("dust")) {
                dustDensity = ((Number) realEnv.get("dust")).floatValue();
            } else if (realEnv.containsKey("pm25")) {
                dustDensity = ((Number) realEnv.get("pm25")).floatValue();
            }
        }

        return IotDto.TelemetryResponse.builder()
                .deviceCode(deviceCode)
                .cpuLoad(round1(cpuLoad))
                .cpuTemp(round1(cpuTemp))
                .cpuClockMhz(clockMhz)
                .ramUsage(round1(ramUsage))
                .ramUsedGb(round1(ramUsedGb))
                .ramTotalGb(16.0f)
                .gpuLoad(round1(gpuLoad))
                .gpuTemp(round1(gpuTemp))
                .fanSpeedRpm(fanRpm)
                .powerDrawW(powerW)
                .ambientTemp(round1(ambTemp))
                .ambientHumidity(round1(ambHum))
                .dustDensity(round1(dustDensity))
                .recordedAt(LocalDateTime.now().toString())
                .build();
    }

    private float round1(float val) {
        return Math.round(val * 10.0f) / 10.0f;
    }
}
