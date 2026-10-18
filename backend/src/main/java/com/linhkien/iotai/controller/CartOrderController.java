package com.linhkien.iotai.controller;

import com.linhkien.iotai.dto.ApiResponse;
import com.linhkien.iotai.dto.order.OrderDto;
import com.linhkien.iotai.security.UserPrincipal;
import com.linhkien.iotai.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CartOrderController {

    private final OrderService orderService;

    @PostMapping("/cart/validate")
    public ResponseEntity<ApiResponse<List<OrderDto.CartValidationItemResult>>> validateCart(@RequestBody OrderDto.ValidateCartRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.validateCart(request)));
    }

    @PostMapping("/coupons/apply")
    public ResponseEntity<ApiResponse<OrderDto.CouponResponse>> applyCoupon(@RequestBody OrderDto.ApplyCouponRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.applyCoupon(request.getCode(), request.getSubtotal())));
    }

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<OrderDto.Response>> createOrder(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody OrderDto.CreateOrderRequest request) {
        Long userId = user != null ? user.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("Đặt hàng thành công", orderService.createOrder(userId, request)));
    }

    @GetMapping("/orders/my")
    public ResponseEntity<ApiResponse<List<OrderDto.Response>>> getMyOrders(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getMyOrders(user.getId())));
    }

    @GetMapping("/orders/track/{orderCode}")
    public ResponseEntity<ApiResponse<OrderDto.Response>> trackOrder(@PathVariable String orderCode) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderByCode(orderCode)));
    }

    @PostMapping("/orders/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderDto.Response>> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody(required = false) OrderDto.CancelOrderRequest request) {
        String reason = request != null ? request.getReason() : "Khách hàng yêu cầu hủy đơn";
        return ResponseEntity.ok(ApiResponse.ok("Hủy đơn hàng thành công", orderService.cancelOrder(id, user.getId(), reason, false)));
    }
}
