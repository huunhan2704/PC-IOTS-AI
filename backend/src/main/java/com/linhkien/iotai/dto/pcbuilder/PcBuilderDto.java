package com.linhkien.iotai.dto.pcbuilder;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.linhkien.iotai.dto.product.ProductDto;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

public class PcBuilderDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BuildSelection {
        private Long cpuId;
        private Long mainboardId;
        private Long ramId;
        private Long gpuId;
        private Long storageId;
        private Long psuId;
        private Long coolerId;
        private Long caseId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaveBuildRequest {
        private String buildName;
        private Long cpuId;
        private Long mainboardId;
        private Long ramId;
        private Long gpuId;
        private Long storageId;
        private Long psuId;
        private Long coolerId;
        private Long caseId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuickCheckRequest {
        private Long productAId;
        private Long productBId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuickCheckResponse {
        private boolean compatible;
        private List<String> messages;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IssueItem {
        private String rule; // BR01..BR06
        private String severity; // ERROR | WARNING
        private String message;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PassedItem {
        private String rule;
        private String message;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompatibilityReport {
        private boolean compatible;
        private BigDecimal totalPrice;
        private Integer totalTdp;
        private Integer recommendedPsu;
        private List<IssueItem> issues;
        private List<PassedItem> passed;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BuildResponse {
        private Long id;
        private String buildName;
        private BigDecimal totalPrice;
        private Integer totalTdp;
        private Integer recommendedPsu;
        private Boolean isCompatible;
        private String compatibilityReport;
        private String createdAt;
        private ProductDto.Response cpu;
        private ProductDto.Response mainboard;
        private ProductDto.Response ram;
        private ProductDto.Response gpu;
        private ProductDto.Response storage;
        private ProductDto.Response psu;
        private ProductDto.Response cooler;
        private ProductDto.Response caseProduct;
    }
}
