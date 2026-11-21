package com.linhkien.iotai.service;

import com.linhkien.iotai.dto.iot.IotDto;
import com.linhkien.iotai.entity.IotAlert;
import com.linhkien.iotai.entity.IotDevice;
import com.linhkien.iotai.entity.TelemetryLog;
import com.linhkien.iotai.entity.enums.DeviceStatus;
import com.linhkien.iotai.entity.enums.Severity;
import com.linhkien.iotai.exception.ResourceNotFoundException;
import com.linhkien.iotai.repository.IotAlertRepository;
import com.linhkien.iotai.repository.IotDeviceRepository;
import com.linhkien.iotai.repository.TelemetryLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IotTelemetryService {

    private final IotDeviceRepository deviceRepository;
    private final TelemetryLogRepository telemetryLogRepository;
    private final IotAlertRepository alertRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ProductMapper productMapper;

    // Track consecutive high temp occurrences for BR09 (3 consecutive samples >= 85°C)
    private final Map<String, Integer> consecutiveOverheatMap = new ConcurrentHashMap<>();

    @Transactional
    public void processTelemetry(String deviceCode, IotDto.TelemetryResponse telemetry) {
        IotDevice device = deviceRepository.findByDeviceCode(deviceCode).orElse(null);
        if (device == null) {
            log.warn("Telemetry received for unknown device: {}", deviceCode);
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        device.setLastPing(now);
        device.setStatus(DeviceStatus.ONLINE);

        // BR09: CPU/GPU Overheat Alarm Threshold (>= 85°C for 3 consecutive cycles)
        float cpuTemp = telemetry.getCpuTemp() != null ? telemetry.getCpuTemp() : 0.0f;
        float gpuTemp = telemetry.getGpuTemp() != null ? telemetry.getGpuTemp() : 0.0f;
        boolean isOverheatSample = (cpuTemp >= 85.0f || gpuTemp >= 85.0f);

        String flag = "NORMAL";

        if (isOverheatSample) {
            int count = consecutiveOverheatMap.getOrDefault(deviceCode, 0) + 1;
            consecutiveOverheatMap.put(deviceCode, count);

            if (count >= 3) {
                flag = "ALERT_OVERHEAT";
                device.setStatus(DeviceStatus.WARNING);
                saveAndBroadcastAlert(device, "ALERT_OVERHEAT", Severity.CRITICAL,
                        String.format("CẢNH BÁO QUÁ NHIỆT (BR09): Nhiệt độ phần cứng liên tục chạm ngưỡng nguy hiểm (CPU: %.1f°C, GPU: %.1f°C)", cpuTemp, gpuTemp),
                        Math.max(cpuTemp, gpuTemp));
            } else {
                flag = "HIGH_LOAD";
            }
        } else {
            consecutiveOverheatMap.put(deviceCode, 0);
        }

        // BR10: Ambient Heat Alarm (ESP32 DHT22 >= 40°C)
        float ambTemp = telemetry.getAmbientTemp() != null ? telemetry.getAmbientTemp() : 0.0f;
        if (ambTemp >= 40.0f) {
            flag = "AMBIENT_HEAT";
            device.setStatus(DeviceStatus.WARNING);
            saveAndBroadcastAlert(device, "AMBIENT_HEAT", Severity.HIGH,
                    String.format("CẢNH BÁO MÔI TRƯỜNG PHÒNG MÁY (BR10): Cảm biến ESP32 ghi nhận nhiệt độ phòng đạt %.1f°C, cần bật điều hòa hoặc quạt thông gió", ambTemp),
                    ambTemp);
        }

        // Dust Alarm: Case Dust Sensor >= 100 ug/m3
        float dustDensity = telemetry.getDustDensity() != null ? telemetry.getDustDensity() : 0.0f;
        if (dustDensity >= 100.0f) {
            if (!"ALERT_OVERHEAT".equals(flag) && !"AMBIENT_HEAT".equals(flag)) {
                flag = "DUST_HIGH";
            }
            device.setStatus(DeviceStatus.WARNING);
            saveAndBroadcastAlert(device, "DUST_HIGH", Severity.HIGH,
                    String.format("CẢNH BÁO BỤI TRONG CASE: Cảm biến ESP32 ghi nhận mật độ bụi %.1f µg/m³ (>= 100 µg/m³). Đề nghị vệ sinh máy và lưới lọc bụi!", dustDensity),
                    dustDensity);
        }

        // Save Telemetry Log to DB
        TelemetryLog logEntity = TelemetryLog.builder()
                .device(device)
                .cpuLoad(telemetry.getCpuLoad() != null ? telemetry.getCpuLoad() : 0.0f)
                .cpuTemp(cpuTemp)
                .cpuClockMhz(telemetry.getCpuClockMhz() != null ? telemetry.getCpuClockMhz() : 3600)
                .ramUsage(telemetry.getRamUsage() != null ? telemetry.getRamUsage() : 0.0f)
                .ramUsedGb(telemetry.getRamUsedGb() != null ? telemetry.getRamUsedGb() : 0.0f)
                .ramTotalGb(telemetry.getRamTotalGb() != null ? telemetry.getRamTotalGb() : 16.0f)
                .gpuLoad(telemetry.getGpuLoad() != null ? telemetry.getGpuLoad() : 0.0f)
                .gpuTemp(gpuTemp)
                .fanSpeedRpm(telemetry.getFanSpeedRpm() != null ? telemetry.getFanSpeedRpm() : 1200)
                .powerDrawW(telemetry.getPowerDrawW() != null ? telemetry.getPowerDrawW() : 150)
                .ambientTemp(ambTemp)
                .ambientHumidity(telemetry.getAmbientHumidity() != null ? telemetry.getAmbientHumidity() : 0.0f)
                .dustDensity(dustDensity)
                .statusFlag(flag)
                .recordedAt(now)
                .build();

        telemetryLogRepository.save(logEntity);
        deviceRepository.save(device);

        // Update telemetry response with statusFlag and formatted time
        String canonicalCode = device.getDeviceCode();
        telemetry.setDeviceCode(canonicalCode);
        telemetry.setStatusFlag(flag);
        telemetry.setRecordedAt(now.toString());

        // Broadcast to WebSocket: /topic/telemetry/{deviceCode}
        messagingTemplate.convertAndSend("/topic/telemetry/" + canonicalCode, telemetry);
    }

    private void saveAndBroadcastAlert(IotDevice device, String type, Severity severity, String message, float val) {
        IotAlert alert = IotAlert.builder()
                .device(device)
                .type(type)
                .severity(severity)
                .message(message)
                .value(val)
                .createdAt(LocalDateTime.now())
                .build();

        IotAlert savedAlert = alertRepository.save(alert);

        IotDto.AlertResponse alertDto = IotDto.AlertResponse.builder()
                .id(savedAlert.getId())
                .deviceCode(device.getDeviceCode())
                .type(savedAlert.getType())
                .severity(savedAlert.getSeverity().name())
                .message(savedAlert.getMessage())
                .value(savedAlert.getValue())
                .createdAt(savedAlert.getCreatedAt().toString())
                .build();

        messagingTemplate.convertAndSend("/topic/alerts/" + device.getDeviceCode(), alertDto);
    }

    @Transactional(readOnly = true)
    public List<IotDto.TelemetryResponse> getTelemetryHistory(String deviceCode, int minutes) {
        IotDevice device = deviceRepository.findByDeviceCode(deviceCode)
                .orElseThrow(() -> new ResourceNotFoundException("Thiết bị không tồn tại: " + deviceCode));

        LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
        List<TelemetryLog> logs = telemetryLogRepository.findRecentByDeviceId(device.getId(), since);

        return logs.stream().map(l -> IotDto.TelemetryResponse.builder()
                .deviceCode(deviceCode)
                .cpuLoad(l.getCpuLoad())
                .cpuTemp(l.getCpuTemp())
                .cpuClockMhz(l.getCpuClockMhz())
                .ramUsage(l.getRamUsage())
                .ramUsedGb(l.getRamUsedGb())
                .ramTotalGb(l.getRamTotalGb())
                .gpuLoad(l.getGpuLoad())
                .gpuTemp(l.getGpuTemp())
                .fanSpeedRpm(l.getFanSpeedRpm())
                .powerDrawW(l.getPowerDrawW())
                .ambientTemp(l.getAmbientTemp())
                .ambientHumidity(l.getAmbientHumidity())
                .dustDensity(l.getDustDensity() != null ? l.getDustDensity() : 0.0f)
                .statusFlag(l.getStatusFlag())
                .recordedAt(l.getRecordedAt().toString())
                .build()).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public IotDto.TelemetryResponse getLatestTelemetry(String deviceCode) {
        IotDevice device = deviceRepository.findByDeviceCode(deviceCode)
                .orElseThrow(() -> new ResourceNotFoundException("Thiết bị không tồn tại: " + deviceCode));

        return telemetryLogRepository.findFirstLatestByDeviceId(device.getId())
                .map(l -> IotDto.TelemetryResponse.builder()
                        .deviceCode(deviceCode)
                        .cpuLoad(l.getCpuLoad())
                        .cpuTemp(l.getCpuTemp())
                        .cpuClockMhz(l.getCpuClockMhz())
                        .ramUsage(l.getRamUsage())
                        .ramUsedGb(l.getRamUsedGb())
                        .ramTotalGb(l.getRamTotalGb())
                        .gpuLoad(l.getGpuLoad())
                        .gpuTemp(l.getGpuTemp())
                        .fanSpeedRpm(l.getFanSpeedRpm())
                        .powerDrawW(l.getPowerDrawW())
                        .ambientTemp(l.getAmbientTemp())
                        .ambientHumidity(l.getAmbientHumidity())
                        .dustDensity(l.getDustDensity() != null ? l.getDustDensity() : 0.0f)
                        .statusFlag(l.getStatusFlag())
                        .recordedAt(l.getRecordedAt().toString())
                        .build())
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<IotDto.AlertResponse> getDeviceAlerts(String deviceCode) {
        return alertRepository.findByDeviceCodeOrderByCreatedAtDesc(deviceCode, PageRequest.of(0, 50)).stream()
                .map(a -> IotDto.AlertResponse.builder()
                        .id(a.getId())
                        .deviceCode(deviceCode)
                        .type(a.getType())
                        .severity(a.getSeverity().name())
                        .message(a.getMessage())
                        .value(a.getValue())
                        .createdAt(a.getCreatedAt().toString())
                        .build())
                .collect(Collectors.toList());
    }

    public IotDto.DeviceResponse toDeviceResponse(IotDevice d) {
        if (d == null) return null;
        return IotDto.DeviceResponse.builder()
                .id(d.getId())
                .userId(d.getUser() != null ? d.getUser().getId() : null)
                .ownerName(d.getUser() != null ? d.getUser().getFullName() : null)
                .deviceCode(d.getDeviceCode())
                .deviceName(d.getDeviceName())
                .macAddress(d.getMacAddress())
                .status(d.getStatus().name())
                .esp32Ip(d.getEsp32Ip())
                .roomLocation(d.getRoomLocation())
                .lastPing(d.getLastPing() != null ? d.getLastPing().toString() : null)
                .currentScenario(d.getCurrentScenario())
                .currentCpu(productMapper.toResponse(d.getCurrentCpu()))
                .currentMainboard(productMapper.toResponse(d.getCurrentMainboard()))
                .currentRam(productMapper.toResponse(d.getCurrentRam()))
                .currentGpu(productMapper.toResponse(d.getCurrentGpu()))
                .currentPsu(productMapper.toResponse(d.getCurrentPsu()))
                .currentCooler(productMapper.toResponse(d.getCurrentCooler()))
                .build();
    }

    /**
     * Tự động chuyển thiết bị sang OFFLINE nếu quá 15 giây không nhận được dữ liệu từ Desktop App / ESP32
     */
    @Scheduled(fixedRate = 10000)
    @Transactional
    public void checkDeviceHeartbeats() {
        LocalDateTime threshold = LocalDateTime.now().minusSeconds(15);
        List<IotDevice> devices = deviceRepository.findAll();
        for (IotDevice d : devices) {
            if (d.getStatus() != DeviceStatus.OFFLINE) {
                if (d.getLastPing() == null || d.getLastPing().isBefore(threshold)) {
                    d.setStatus(DeviceStatus.OFFLINE);
                    deviceRepository.save(d);
                    log.info("Device {} marked OFFLINE due to heartbeat timeout", d.getDeviceCode());
                }
            }
        }
    }
}
