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
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class InternalSimulatorService {

    private final IotDeviceRepository deviceRepository;
    private final IotTelemetryService telemetryService;

    @Value("${app.simulator.internal-enabled:true}")
    private boolean simulatorEnabled;

    private final ConcurrentHashMap<String, String> scenarioMap = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public void setScenario(String deviceCode, String scenario) {
        scenarioMap.put(deviceCode, scenario.toUpperCase());
        deviceRepository.findByDeviceCode(deviceCode).ifPresent(d -> {
            d.setCurrentScenario(scenario.toUpperCase());
            deviceRepository.save(d);
        });
    }

    public String getScenario(String deviceCode) {
        return scenarioMap.getOrDefault(deviceCode, "IDLE");
    }

    @Scheduled(fixedRateString = "${app.simulator.interval-ms:2000}")
    public void generateSimulatedTelemetry() {
        if (!simulatorEnabled) {
            return;
        }

        List<IotDevice> devices = deviceRepository.findAll();
        for (IotDevice dev : devices) {
            String sc = scenarioMap.computeIfAbsent(dev.getDeviceCode(), k ->
                    dev.getCurrentScenario() != null ? dev.getCurrentScenario() : "IDLE"
            );

            if ("STOP".equalsIgnoreCase(sc)) {
                continue;
            }

            IotDto.TelemetryResponse telem = simulateMetrics(dev.getDeviceCode(), sc);
            try {
                telemetryService.processTelemetry(dev.getDeviceCode(), telem);
            } catch (Exception e) {
                log.error("Internal simulation push failed for {}: {}", dev.getDeviceCode(), e.getMessage());
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
                .recordedAt(LocalDateTime.now().toString())
                .build();
    }

    private float round1(float val) {
        return Math.round(val * 10.0f) / 10.0f;
    }
}
