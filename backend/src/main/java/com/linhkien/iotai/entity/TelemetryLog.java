package com.linhkien.iotai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "telemetry_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelemetryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private IotDevice device;

    @Column(name = "cpu_load", nullable = false)
    private Float cpuLoad;

    @Column(name = "cpu_temp", nullable = false)
    private Float cpuTemp;

    @Column(name = "cpu_clock_mhz", nullable = false)
    @Builder.Default
    private Integer cpuClockMhz = 3600;

    @Column(name = "ram_usage", nullable = false)
    private Float ramUsage;

    @Column(name = "ram_used_gb", nullable = false)
    private Float ramUsedGb;

    @Column(name = "ram_total_gb", nullable = false)
    @Builder.Default
    private Float ramTotalGb = 16.0f;

    @Column(name = "gpu_load", nullable = false)
    private Float gpuLoad;

    @Column(name = "gpu_temp", nullable = false)
    private Float gpuTemp;

    @Column(name = "fan_speed_rpm", nullable = false)
    private Integer fanSpeedRpm;

    @Column(name = "power_draw_w", nullable = false)
    @Builder.Default
    private Integer powerDrawW = 150;

    @Column(name = "ambient_temp", nullable = false)
    private Float ambientTemp;

    @Column(name = "ambient_humidity", nullable = false)
    private Float ambientHumidity;

    @Column(name = "status_flag", nullable = false, length = 50)
    @Builder.Default
    private String statusFlag = "NORMAL";

    @Column(name = "recorded_at", nullable = false)
    @Builder.Default
    private LocalDateTime recordedAt = LocalDateTime.now();
}
