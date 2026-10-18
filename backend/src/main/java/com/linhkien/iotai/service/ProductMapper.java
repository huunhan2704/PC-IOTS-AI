package com.linhkien.iotai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.linhkien.iotai.dto.product.ProductDto;
import com.linhkien.iotai.entity.Category;
import com.linhkien.iotai.entity.Product;
import com.linhkien.iotai.entity.ProductImage;
import com.linhkien.iotai.entity.ProductSpec;
import com.linhkien.iotai.entity.Review;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductMapper {

    private final ObjectMapper objectMapper;

    public ProductDto.Response toResponse(Product product) {
        if (product == null) return null;

        List<String> imageList = Collections.emptyList();
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            imageList = product.getImages().stream()
                    .map(ProductImage::getImageUrl)
                    .collect(Collectors.toList());
        }

        double avgRating = 5.0;
        int reviewCount = 0;
        if (product.getReviews() != null && !product.getReviews().isEmpty()) {
            reviewCount = product.getReviews().size();
            avgRating = product.getReviews().stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(5.0);
            avgRating = Math.round(avgRating * 10.0) / 10.0;
        }

        return ProductDto.Response.builder()
                .id(product.getId())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                .name(product.getName())
                .slug(product.getSlug())
                .brand(product.getBrand())
                .price(product.getPrice())
                .originalPrice(product.getOriginalPrice())
                .stockQuantity(product.getStockQuantity())
                .warrantyMonths(product.getWarrantyMonths())
                .imageUrl(product.getImageUrl())
                .images(imageList)
                .description(product.getDescription())
                .isActive(product.getIsActive())
                .rating(avgRating)
                .reviewCount(reviewCount)
                .specs(toSpecResponse(product.getSpecs()))
                .build();
    }

    public ProductDto.SpecResponse toSpecResponse(ProductSpec spec) {
        if (spec == null) return null;

        Map<String, Object> technicalMap = null;
        if (spec.getTechnicalJson() != null && !spec.getTechnicalJson().isBlank()) {
            try {
                technicalMap = objectMapper.readValue(spec.getTechnicalJson(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse technicalJson for spec ID {}: {}", spec.getId(), e.getMessage());
            }
        }

        return ProductDto.SpecResponse.builder()
                .socket(spec.getSocket())
                .ramGeneration(spec.getRamGeneration())
                .ramBus(spec.getRamBus())
                .formFactor(spec.getFormFactor())
                .tdp(spec.getTdp())
                .psuWattage(spec.getPsuWattage())
                .psuEfficiency(spec.getPsuEfficiency())
                .vram(spec.getVram())
                .storageInterface(spec.getStorageInterface())
                .coolingType(spec.getCoolingType())
                .dimensions(spec.getDimensions())
                .coolerTdpRating(spec.getCoolerTdpRating())
                .gpuLengthMm(spec.getGpuLengthMm())
                .maxGpuLengthMm(spec.getMaxGpuLengthMm())
                .supportedFormFactors(spec.getSupportedFormFactors())
                .cores(spec.getCores())
                .threads(spec.getThreads())
                .baseClock(spec.getBaseClock())
                .boostClock(spec.getBoostClock())
                .capacityGb(spec.getCapacityGb())
                .technicalJson(technicalMap)
                .build();
    }

    public ProductDto.CategoryResponse toCategoryResponse(Category category) {
        if (category == null) return null;
        long count = category.getProducts() != null ? category.getProducts().stream().filter(Product::getIsActive).count() : 0L;
        return ProductDto.CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .icon(category.getIcon())
                .description(category.getDescription())
                .displayOrder(category.getDisplayOrder())
                .productCount(count)
                .build();
    }

    public ProductDto.ReviewResponse toReviewResponse(Review review) {
        if (review == null) return null;
        return ProductDto.ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct() != null ? review.getProduct().getId() : null)
                .userFullName(review.getUser() != null ? review.getUser().getFullName() : "Khách hàng")
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt().toString())
                .build();
    }
}
