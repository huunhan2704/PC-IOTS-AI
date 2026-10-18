package com.linhkien.iotai.dto.ai;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.linhkien.iotai.dto.product.ProductDto;
import lombok.*;

import java.util.List;

public class AiDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DiagnosticMetrics {
        private Float avgCpuLoad;
        private Float p95CpuLoad;
        private Float avgGpuLoad;
        private Float avgRamUsage;
        private Float ramOver88Ratio;
        private Float maxCpuTemp;
        private Float maxGpuTemp;
        private Float avgCpuTemp;
        private Float overheatRatio;
        private Integer peakPowerW;
        private Integer psuWattage;
        private Float psuLoadRatio;
        private Integer maxFanRpm;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FindingItem {
        private String bottleneckType;
        private String severity;
        private String diagnosticText;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RecommendationResponse {
        private Long id;
        private String bottleneckType;
        private String severity;
        private String diagnosticText;
        private ProductDto.Response currentComponent;
        private ProductDto.Response recommendedProduct;
        private String expectedPerformanceGain;
        private Boolean isViewed;
        private Boolean isApplied;
        private String createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DiagnosticReport {
        private String deviceCode;
        private String deviceName;
        private Integer healthScore; // 0..100
        private Integer analyzedSamples;
        private Integer periodDays;
        private String generatedAt;
        private DiagnosticMetrics metrics;
        private List<FindingItem> findings;
        private List<RecommendationResponse> recommendations;
    }
}
