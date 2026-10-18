package com.linhkien.iotai.controller;

import com.linhkien.iotai.dto.ApiResponse;
import com.linhkien.iotai.dto.PageResponse;
import com.linhkien.iotai.dto.product.ProductDto;
import com.linhkien.iotai.security.UserPrincipal;
import com.linhkien.iotai.service.GeneralAppService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

    private final GeneralAppService appService;

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<ProductDto.CategoryResponse>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok(appService.getAllCategories()));
    }

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<PageResponse<ProductDto.Response>>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) List<String> brands,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String socket,
            @RequestParam(required = false) String ramGeneration,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        Page<ProductDto.Response> pageResult = appService.getProducts(
                keyword, category, brands, minPrice, maxPrice, socket, ramGeneration, inStock, sort, PageRequest.of(page, size)
        );

        PageResponse<ProductDto.Response> response = PageResponse.<ProductDto.Response>builder()
                .content(pageResult.getContent())
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/products/suggest")
    public ResponseEntity<ApiResponse<List<ProductDto.Suggestion>>> suggestProducts(@RequestParam(name = "q", defaultValue = "") String query) {
        return ResponseEntity.ok(ApiResponse.ok(appService.searchSuggestions(query)));
    }

    @GetMapping("/products/brands")
    public ResponseEntity<ApiResponse<List<String>>> getBrands() {
        return ResponseEntity.ok(ApiResponse.ok(appService.getBrands()));
    }

    @GetMapping("/products/{idOrSlug}")
    public ResponseEntity<ApiResponse<ProductDto.Response>> getProduct(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(ApiResponse.ok(appService.getProductByIdOrSlug(idOrSlug)));
    }

    @GetMapping("/products/{id}/reviews")
    public ResponseEntity<ApiResponse<List<ProductDto.ReviewResponse>>> getProductReviews(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(appService.getProductReviews(id)));
    }

    @PostMapping("/products/{id}/reviews")
    public ResponseEntity<ApiResponse<ProductDto.ReviewResponse>> createReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody ProductDto.CreateReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(appService.createReview(id, user.getId(), request)));
    }
}
