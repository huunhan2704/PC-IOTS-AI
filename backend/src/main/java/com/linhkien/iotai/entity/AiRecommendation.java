package com.linhkien.iotai.entity;

import com.linhkien.iotai.entity.enums.Severity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_recommendations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private IotDevice device;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "bottleneck_type", nullable = false, length = 50)
    private String bottleneckType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Severity severity;

    @Column(name = "diagnostic_text", nullable = false, columnDefinition = "TEXT")
    private String diagnosticText;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_product_id")
    private Product currentProduct;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recommended_product_id", nullable = false)
    private Product recommendedProduct;

    @Column(name = "expected_performance_gain")
    private String expectedPerformanceGain;

    @Column(name = "is_viewed", nullable = false)
    @Builder.Default
    private Boolean isViewed = false;

    @Column(name = "is_applied", nullable = false)
    @Builder.Default
    private Boolean isApplied = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
