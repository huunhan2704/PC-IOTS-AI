package com.linhkien.iotai.entity;

import com.linhkien.iotai.entity.enums.DeviceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "iot_devices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IotDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "device_code", nullable = false, unique = true, length = 50)
    private String deviceCode;

    @Column(name = "device_name", nullable = false, length = 150)
    private String deviceName;

    @Column(name = "mac_address", length = 50)
    private String macAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private DeviceStatus status = DeviceStatus.OFFLINE;

    @Column(name = "esp32_ip", length = 50)
    private String esp32Ip;

    @Column(name = "room_location", length = 150)
    private String roomLocation;

    @Column(name = "last_ping")
    private LocalDateTime lastPing;

    @Column(name = "current_scenario", length = 30)
    @Builder.Default
    private String currentScenario = "IDLE";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_cpu_id")
    private Product currentCpu;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_mainboard_id")
    private Product currentMainboard;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_ram_id")
    private Product currentRam;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_gpu_id")
    private Product currentGpu;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_psu_id")
    private Product currentPsu;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_cooler_id")
    private Product currentCooler;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
