package com.linhkien.iotai.dto.product;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class ProductDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Response {
        private Long id;
        private Long categoryId;
        private String categoryName;
        private String categorySlug;
        private String name;
        private String slug;
        private String brand;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private Integer stockQuantity;
        private Integer warrantyMonths;
        private String imageUrl;
        private List<String> images;
        private String description;
        private Boolean isActive;
        private Double rating;
        private Integer reviewCount;
        private SpecResponse specs;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SpecResponse {
        private String socket;
        private String ramGeneration;
        private Integer ramBus;
        private String formFactor;
        private Integer tdp;
        private Integer psuWattage;
        private String psuEfficiency;
        private Integer vram;
        private String storageInterface;
        private String coolingType;
        private String dimensions;
        private Integer coolerTdpRating;
        private Integer gpuLengthMm;
        private Integer maxGpuLengthMm;
        private String supportedFormFactors;
        private Integer cores;
        private Integer threads;
        private String baseClock;
        private String boostClock;
        private Integer capacityGb;
        private Map<String, Object> technicalJson;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Suggestion {
        private Long id;
        private String name;
        private String slug;
        private String imageUrl;
        private BigDecimal price;
        private String categorySlug;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryResponse {
        private Long id;
        private String name;
        private String slug;
        private String icon;
        private String description;
        private Integer displayOrder;
        private Long productCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewResponse {
        private Long id;
        private Long productId;
        private String userFullName;
        private Integer rating;
        private String comment;
        private String createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateReviewRequest {
        private Integer rating;
        private String comment;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaveProductRequest {
        private Long categoryId;
        private String name;
        private String slug;
        private String brand;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private Integer stockQuantity;
        private Integer warrantyMonths;
        private String imageUrl;
        private List<String> images;
        private String description;
        private Boolean isActive;
        private SpecResponse specs;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateStockRequest {
        private Integer quantity;
        private String note;
    }
}
