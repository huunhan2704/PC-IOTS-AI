package com.linhkien.iotai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pc_builds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PcBuild {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "build_name", nullable = false, length = 150)
    private String buildName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cpu_id")
    private Product cpu;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mainboard_id")
    private Product mainboard;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ram_id")
    private Product ram;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "gpu_id")
    private Product gpu;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "storage_id")
    private Product storage;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "psu_id")
    private Product psu;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cooler_id")
    private Product cooler;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "case_id")
    private Product caseProduct;

    @Column(name = "total_price", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @Column(name = "total_tdp", nullable = false)
    @Builder.Default
    private Integer totalTdp = 0;

    @Column(name = "recommended_psu", nullable = false)
    @Builder.Default
    private Integer recommendedPsu = 0;

    @Column(name = "is_compatible", nullable = false)
    @Builder.Default
    private Boolean isCompatible = true;

    @Column(name = "compatibility_report", columnDefinition = "TEXT")
    private String compatibilityReport;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
