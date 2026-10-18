package com.linhkien.iotai.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_specs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSpec {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(length = 50)
    private String socket;

    @Column(name = "ram_generation", length = 50)
    private String ramGeneration;

    @Column(name = "ram_bus")
    private Integer ramBus;

    @Column(name = "form_factor", length = 50)
    private String formFactor;

    @Column(nullable = false)
    @Builder.Default
    private Integer tdp = 0;

    @Column(name = "psu_wattage")
    private Integer psuWattage;

    @Column(name = "psu_efficiency", length = 50)
    private String psuEfficiency;

    private Integer vram;

    @Column(name = "storage_interface", length = 50)
    private String storageInterface;

    @Column(name = "cooling_type", length = 50)
    private String coolingType;

    @Column(length = 100)
    private String dimensions;

    @Column(name = "cooler_tdp_rating")
    private Integer coolerTdpRating;

    @Column(name = "gpu_length_mm")
    private Integer gpuLengthMm;

    @Column(name = "max_gpu_length_mm")
    private Integer maxGpuLengthMm;

    @Column(name = "supported_form_factors", length = 100)
    private String supportedFormFactors;

    private Integer cores;
    private Integer threads;

    @Column(name = "base_clock", length = 30)
    private String baseClock;

    @Column(name = "boost_clock", length = 30)
    private String boostClock;

    @Column(name = "capacity_gb")
    private Integer capacityGb;

    @Column(name = "technical_json", columnDefinition = "TEXT")
    private String technicalJson;
}
