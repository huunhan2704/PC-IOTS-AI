package com.linhkien.iotai.dto.order;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

public class OrderDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CartItemValidate {
        private Long productId;
        private Integer quantity;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidateCartRequest {
        @NotEmpty
        private List<CartItemValidate> items;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CartValidationItemResult {
        private Long productId;
        private String name;
        private Integer requested;
        private Integer stockQuantity;
        private boolean available;
        private BigDecimal price;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplyCouponRequest {
        @NotBlank
        private String code;
        private BigDecimal subtotal;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CouponResponse {
        private String code;
        private String description;
        private BigDecimal discountAmount;
        private boolean freeShipping;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateOrderRequest {
        @NotBlank(message = "Họ tên người nhận không được để trống")
        private String customerName;

        @NotBlank(message = "Số điện thoại không được để trống")
        private String phone;

        @NotBlank(message = "Địa chỉ nhận hàng không được để trống")
        private String shippingAddress;

        @NotBlank(message = "Tỉnh/Thành phố không được để trống")
        private String city;

        private String note;

        @NotBlank(message = "Phương thức thanh toán không được để trống")
        private String paymentMethod; // COD | BANK_TRANSFER_QR

        private String couponCode;

        @NotEmpty(message = "Giỏ hàng không được để trống")
        private List<CartItemValidate> items;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Response {
        private Long id;
        private String orderCode;
        private Long userId;
        private String customerName;
        private String phone;
        private String shippingAddress;
        private String city;
        private String paymentMethod;
        private String paymentStatus;
        private String orderStatus;
        private BigDecimal totalAmount;
        private BigDecimal discountAmount;
        private String couponCode;
        private BigDecimal shippingFee;
        private BigDecimal finalAmount;
        private String note;
        private String createdAt;
        private String updatedAt;
        private List<ItemResponse> items;
        private PaymentResponse payment;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String imageUrl;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal subtotal;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentResponse {
        private String bankId;
        private String bankName;
        private String accountNo;
        private String accountName;
        private BigDecimal amount;
        private String content;
        private String qrPayload;
        private String qrImageUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateStatusRequest {
        private String status;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdatePaymentRequest {
        private String paymentStatus;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CancelOrderRequest {
        private String reason;
    }
}
