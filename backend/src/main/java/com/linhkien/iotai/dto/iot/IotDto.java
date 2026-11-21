package com.linhkien.iotai.dto.iot;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.linhkien.iotai.dto.product.ProductDto;
import lombok.*;

import java.time.LocalDateTime;

public class IotDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DeviceResponse {
        private Long id;
        private Long userId;
        private String ownerName;
        private String deviceCode;
        private String deviceName;
        private String macAddress;
        private String status;
        private String esp32Ip;
        private String roomLocation;
        private String lastPing;
        private String currentScenario;
        private ProductDto.Response currentCpu;
        private ProductDto.Response currentMainboard;
        private ProductDto.Response currentRam;
        private ProductDto.Response currentGpu;
        private ProductDto.Response currentPsu;
        private ProductDto.Response currentCooler;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateDeviceRequest {
        private String deviceName;
        private String roomLocation;
        private String macAddress;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TelemetryResponse {
        private String deviceCode;
        private Float cpuLoad;
        private Float cpuTemp;
        private Integer cpuClockMhz;
        private Float ramUsage;
        private Float ramUsedGb;
        private Float ramTotalGb;
        private Float gpuLoad;
        private Float gpuTemp;
        private Integer fanSpeedRpm;
        private Integer powerDrawW;
        private Float ambientTemp;
        private Float ambientHumidity;
        private Float dustDensity;
        private String statusFlag;
        private String recordedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AlertResponse {
        private Long id;
        private String deviceCode;
        private String type;
        private String severity;
        private String message;
        private Float value;
        private String createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SimulateRequest {
        private String deviceCode;
        private String scenario; // IDLE | GAMING | STRESS | STOP
    }
}
