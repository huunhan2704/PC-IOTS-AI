package com.linhkien.iotai.service;

import com.linhkien.iotai.dto.order.OrderDto;
import com.linhkien.iotai.entity.*;
import com.linhkien.iotai.entity.enums.DeviceStatus;
import com.linhkien.iotai.entity.enums.DiscountType;
import com.linhkien.iotai.entity.enums.OrderStatus;
import com.linhkien.iotai.entity.enums.PaymentMethod;
import com.linhkien.iotai.entity.enums.PaymentStatus;
import com.linhkien.iotai.exception.BadRequestException;
import com.linhkien.iotai.exception.ResourceNotFoundException;
import com.linhkien.iotai.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final IotDeviceRepository iotDeviceRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final VietQrService vietQrService;
    private final ProductMapper productMapper;

    private final Optional<StringRedisTemplate> redisTemplate;
    private final Optional<RabbitTemplate> rabbitTemplate;

    @Value("${app.redis.enabled:false}")
    private boolean redisEnabled;

    @Value("${app.rabbitmq.enabled:false}")
    private boolean rabbitmqEnabled;

    @Transactional(readOnly = true)
    public List<OrderDto.CartValidationItemResult> validateCart(OrderDto.ValidateCartRequest request) {
        List<OrderDto.CartValidationItemResult> results = new ArrayList<>();
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return results;
        }

        for (OrderDto.CartItemValidate item : request.getItems()) {
            Product p = productRepository.findById(item.getProductId()).orElse(null);
            if (p == null) {
                results.add(OrderDto.CartValidationItemResult.builder()
                        .productId(item.getProductId())
                        .name("Sản phẩm không tồn tại")
                        .requested(item.getQuantity())
                        .stockQuantity(0)
                        .available(false)
                        .price(BigDecimal.ZERO)
                        .build());
            } else {
                boolean avail = p.getIsActive() && p.getStockQuantity() >= item.getQuantity();
                results.add(OrderDto.CartValidationItemResult.builder()
                        .productId(p.getId())
                        .name(p.getName())
                        .requested(item.getQuantity())
                        .stockQuantity(p.getStockQuantity())
                        .available(avail)
                        .price(p.getPrice())
                        .build());
            }
        }
        return results;
    }

    @Transactional(readOnly = true)
    public OrderDto.CouponResponse applyCoupon(String code, BigDecimal subtotal) {
        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndIsActiveTrue(code)
                .orElseThrow(() -> new BadRequestException("Mã giảm giá '" + code + "' không tồn tại hoặc đã hết hạn"));

        if (subtotal.compareTo(coupon.getMinOrder()) < 0) {
            throw new BadRequestException("Đơn hàng chưa đạt giá trị tối thiểu " + coupon.getMinOrder().longValue() + "đ để áp dụng mã " + code);
        }

        BigDecimal discount = BigDecimal.ZERO;
        boolean freeShipping = false;

        if (coupon.getDiscountType() == DiscountType.FREESHIP) {
            freeShipping = true;
        } else if (coupon.getDiscountType() == DiscountType.PERCENT) {
            BigDecimal rate = coupon.getDiscountValue().divide(BigDecimal.valueOf(100));
            discount = subtotal.multiply(rate);
            if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
                discount = coupon.getMaxDiscount();
            }
        } else if (coupon.getDiscountType() == DiscountType.FIXED) {
            discount = coupon.getDiscountValue();
            if (discount.compareTo(subtotal) > 0) {
                discount = subtotal;
            }
        }

        return OrderDto.CouponResponse.builder()
                .code(coupon.getCode())
                .description(coupon.getDescription())
                .discountAmount(discount)
                .freeShipping(freeShipping)
                .build();
    }

    /**
     * BR07 (Stock Inventory Check) & BR08 (Order Transactional Rollback):
     * Uses pessimistic write lock on products ordered by ID to avoid deadlocks.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public OrderDto.Response createOrder(Long userId, OrderDto.CreateOrderRequest req) {
        if (userId == null) {
            throw new BadRequestException("Vui lòng đăng nhập tài khoản trước khi đặt mua hàng");
        }
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new BadRequestException("Giỏ hàng của bạn đang trống");
        }
        if (req.getPhone() == null || !req.getPhone().trim().matches("^0\\d{9}$")) {
            throw new BadRequestException("Số điện thoại nhận hàng phải gồm đúng 10 chữ số và bắt đầu bằng số 0");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("Tài khoản không tồn tại, vui lòng đăng nhập lại"));

        // 1. Sort product IDs to prevent database deadlocks
        List<Long> productIds = req.getItems().stream()
                .map(OrderDto.CartItemValidate::getProductId)
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        // 2. Fetch and lock products with PESSIMISTIC_WRITE
        List<Product> products = productRepository.findAllByIdInForUpdate(productIds);
        Map<Long, Product> productMap = products.stream().collect(Collectors.toMap(Product::getId, p -> p));

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        // 3. Check stock and prepare order items
        for (OrderDto.CartItemValidate itemReq : req.getItems()) {
            Product p = productMap.get(itemReq.getProductId());
            if (p == null || !p.getIsActive()) {
                throw new BadRequestException("Sản phẩm ID " + itemReq.getProductId() + " không còn kinh doanh hoặc không tồn tại");
            }

            if (p.getStockQuantity() < itemReq.getQuantity()) {
                throw new BadRequestException("Sản phẩm '" + p.getName() + "' chỉ còn " + p.getStockQuantity() + " chiếc trong kho (yêu cầu " + itemReq.getQuantity() + ")");
            }

            // Deduct stock immediately in transaction
            p.setStockQuantity(p.getStockQuantity() - itemReq.getQuantity());

            BigDecimal subtotal = p.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = OrderItem.builder()
                    .product(p)
                    .productName(p.getName())
                    .unitPrice(p.getPrice())
                    .quantity(itemReq.getQuantity())
                    .subtotal(subtotal)
                    .build();

            orderItems.add(orderItem);
        }

        // 4. Calculate coupon discount & shipping fee
        BigDecimal discountAmount = BigDecimal.ZERO;
        boolean isFreeShippingCoupon = false;

        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            try {
                OrderDto.CouponResponse couponRes = applyCoupon(req.getCouponCode(), totalAmount);
                discountAmount = couponRes.getDiscountAmount();
                isFreeShippingCoupon = couponRes.isFreeShipping();
            } catch (Exception e) {
                log.warn("Coupon apply failed during checkout: {}", e.getMessage());
            }
        }

        BigDecimal subAfterDiscount = totalAmount.subtract(discountAmount);
        if (subAfterDiscount.compareTo(BigDecimal.ZERO) < 0) {
            subAfterDiscount = BigDecimal.ZERO;
        }

        BigDecimal shippingFee = BigDecimal.valueOf(40000);
        if (subAfterDiscount.compareTo(BigDecimal.valueOf(5000000)) >= 0 || isFreeShippingCoupon) {
            shippingFee = BigDecimal.ZERO;
        }

        BigDecimal finalAmount = subAfterDiscount.add(shippingFee);

        // 5. Generate Order Code
        String orderCode = generateOrderCode();

        PaymentMethod paymentMethod = PaymentMethod.valueOf(req.getPaymentMethod().toUpperCase().trim());

        Order order = Order.builder()
                .orderCode(orderCode)
                .user(user)
                .customerName(req.getCustomerName())
                .phone(req.getPhone())
                .shippingAddress(req.getShippingAddress())
                .city(req.getCity())
                .paymentMethod(paymentMethod)
                .paymentStatus(PaymentStatus.UNPAID)
                .orderStatus(OrderStatus.CHO_XAC_NHAN)
                .totalAmount(totalAmount)
                .discountAmount(discountAmount)
                .couponCode(req.getCouponCode())
                .shippingFee(shippingFee)
                .finalAmount(finalAmount)
                .note(req.getNote())
                .build();

        for (OrderItem oi : orderItems) {
            oi.setOrder(order);
        }
        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);

        // Lưu ý: Khâu cấp thiết bị IoT ESP32 chỉ được thực hiện SAU KHI đơn hàng được Admin Xác Nhận (chuyển sang DA_XAC_NHAN).

        // 6. Publish RabbitMQ event if enabled
        if (rabbitmqEnabled && rabbitTemplate.isPresent()) {
            try {
                rabbitTemplate.get().convertAndSend("order.exchange", "order.created", savedOrder.getOrderCode());
            } catch (Exception e) {
                log.warn("RabbitMQ publish order.created failed: {}", e.getMessage());
            }
        }

        return toOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderDto.Response> getMyOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderDto.Response getOrderByCode(String orderCode) {
        Order order = orderRepository.findByOrderCodeWithItems(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với mã: " + orderCode));
        return toOrderResponse(order);
    }

    /**
     * BR14: Cancel order and rollback stock if CHO_XAC_NHAN
     */
    @Transactional(rollbackFor = Exception.class)
    public OrderDto.Response cancelOrder(Long orderId, Long userId, String reason, boolean isAdmin) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng ID: " + orderId));

        if (!isAdmin && (order.getUser() == null || !order.getUser().getId().equals(userId))) {
            throw new BadRequestException("Bạn không có quyền hủy đơn hàng này");
        }

        if (order.getOrderStatus() != OrderStatus.CHO_XAC_NHAN && !isAdmin) {
            throw new BadRequestException("Chỉ có thể hủy đơn hàng khi trạng thái là 'Chờ xác nhận'");
        }

        if (order.getOrderStatus() == OrderStatus.DA_HUY) {
            throw new BadRequestException("Đơn hàng này đã bị hủy trước đó");
        }

        // Return stock
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                Product p = item.getProduct();
                p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
                productRepository.save(p);

                inventoryLogRepository.save(InventoryLog.builder()
                        .product(p)
                        .admin(null)
                        .quantity(item.getQuantity())
                        .note("Hoàn trả kho từ đơn hủy: " + order.getOrderCode())
                        .build());
            }
        }

        order.setOrderStatus(OrderStatus.DA_HUY);
        order.setCancelReason(reason != null ? reason : "Khách hàng hủy đơn hàng");
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            order.setPaymentStatus(PaymentStatus.REFUNDED);
        }

        return toOrderResponse(orderRepository.save(order));
    }

    /**
     * BR14: Unidirectional state transition for admin
     */
    @Transactional(rollbackFor = Exception.class)
    public OrderDto.Response updateOrderStatus(Long orderId, String newStatusStr) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng ID: " + orderId));

        OrderStatus newStatus = OrderStatus.valueOf(newStatusStr);
        OrderStatus current = order.getOrderStatus();

        if (current == OrderStatus.DA_HUY) {
            throw new BadRequestException("Không thể cập nhật trạng thái đơn đã hủy");
        }
        if (current == OrderStatus.DA_GIAO) {
            throw new BadRequestException("Đơn hàng đã giao thành công, không thể thay đổi trạng thái");
        }

        // Validate 1-step unidirectional flow: CHO_XAC_NHAN -> DA_XAC_NHAN -> DANG_GIAO -> DA_GIAO
        boolean validStep = false;
        if (current == OrderStatus.CHO_XAC_NHAN && newStatus == OrderStatus.DA_XAC_NHAN) validStep = true;
        if (current == OrderStatus.DA_XAC_NHAN && newStatus == OrderStatus.DANG_GIAO) validStep = true;
        if (current == OrderStatus.DANG_GIAO && newStatus == OrderStatus.DA_GIAO) {
            validStep = true;
            // If COD and delivered, mark paid automatically
            if (order.getPaymentMethod() == PaymentMethod.COD) {
                order.setPaymentStatus(PaymentStatus.PAID);
            }
        }

        if (!validStep) {
            throw new BadRequestException("Chuyển đổi trạng thái không hợp lệ theo quy tắc BR14: Từ " + current + " sang " + newStatus);
        }

        order.setOrderStatus(newStatus);

        // Chỉ khi đơn hàng được XÁC NHẬN (CHO_XAC_NHAN -> DA_XAC_NHAN) mới chuyển qua khâu cấp thiết bị IoT
        if (newStatus == OrderStatus.DA_XAC_NHAN) {
            provisionIotDeviceOnConfirm(order);
        }

        return toOrderResponse(orderRepository.save(order));
    }

    private void provisionIotDeviceOnConfirm(Order order) {
        User user = order.getUser();
        if (user == null || order.getItems() == null || order.getItems().isEmpty()) {
            return;
        }
        // Tránh cấp trùng nếu đơn đã được cấp mã Node IoT
        if (order.getNote() != null && order.getNote().contains("Mã Node IoT:")) {
            return;
        }

        Product boughtCpu = null, boughtMb = null, boughtRam = null, boughtGpu = null, boughtPsu = null, boughtCooler = null;
        Set<String> catSlugs = new HashSet<>();
        for (OrderItem oi : order.getItems()) {
            Product prod = oi.getProduct();
            if (prod != null && prod.getCategory() != null && prod.getCategory().getSlug() != null) {
                String slug = prod.getCategory().getSlug().toLowerCase();
                catSlugs.add(slug);
                switch (slug) {
                    case "cpu" -> boughtCpu = prod;
                    case "mainboard" -> boughtMb = prod;
                    case "ram" -> boughtRam = prod;
                    case "vga" -> boughtGpu = prod;
                    case "psu" -> boughtPsu = prod;
                    case "cooler" -> boughtCooler = prod;
                }
            }
        }

        boolean isFullPcSet = (boughtCpu != null && boughtMb != null && boughtRam != null && boughtPsu != null) || catSlugs.size() >= 5;
        if (isFullPcSet) {
            String randomSuffix = String.valueOf(ThreadLocalRandom.current().nextInt(1000, 9999));
            String deviceCode = "PC-" + user.getUsername().toUpperCase().replaceAll("[^A-Z0-9]", "") + "-" + randomSuffix;
            while (iotDeviceRepository.findByDeviceCode(deviceCode).isPresent()) {
                deviceCode = "PC-" + user.getUsername().toUpperCase().replaceAll("[^A-Z0-9]", "") + "-" + ThreadLocalRandom.current().nextInt(1000, 9999);
            }

            IotDevice autoDevice = IotDevice.builder()
                    .user(user)
                    .deviceCode(deviceCode)
                    .deviceName("Bộ PC Lắp Ráp Kèm ESP32 (" + order.getOrderCode() + ")")
                    .status(DeviceStatus.OFFLINE)
                    .esp32Ip("192.168.1." + ThreadLocalRandom.current().nextInt(100, 250))
                    .roomLocation(order.getCity() != null ? order.getCity() : "Nhà khách hàng")
                    .currentScenario("IDLE")
                    .currentCpu(boughtCpu)
                    .currentMainboard(boughtMb)
                    .currentRam(boughtRam)
                    .currentGpu(boughtGpu)
                    .currentPsu(boughtPsu)
                    .currentCooler(boughtCooler)
                    .build();

            iotDeviceRepository.save(autoDevice);

            String extraNote = "[TẶNG KÈM ESP32 ĐÃ KÍCH HOẠT] Mã Node IoT: " + deviceCode + " (Đã gắn vào tài khoản " + user.getUsername() + " sau khi xác nhận đơn)";
            order.setNote((order.getNote() != null && !order.getNote().isBlank()) ? order.getNote() + " | " + extraNote : extraNote);
            log.info("Auto-provisioned ESP32 IoT device {} for user {} upon confirming order {}", deviceCode, user.getUsername(), order.getOrderCode());
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public OrderDto.Response updatePaymentStatus(Long orderId, String paymentStatusStr) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng ID: " + orderId));

        PaymentStatus newStatus = PaymentStatus.valueOf(paymentStatusStr);
        order.setPaymentStatus(newStatus);
        return toOrderResponse(orderRepository.save(order));
    }

    public OrderDto.Response toOrderResponse(Order order) {
        if (order == null) return null;

        List<OrderDto.ItemResponse> itemDtos = new ArrayList<>();
        if (order.getItems() != null) {
            itemDtos = order.getItems().stream().map(item -> OrderDto.ItemResponse.builder()
                    .id(item.getId())
                    .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                    .productName(item.getProductName())
                    .imageUrl(item.getProduct() != null ? item.getProduct().getImageUrl() : null)
                    .unitPrice(item.getUnitPrice())
                    .quantity(item.getQuantity())
                    .subtotal(item.getSubtotal())
                    .warrantyMonths(item.getProduct() != null ? item.getProduct().getWarrantyMonths() : 12)
                    .build()).collect(Collectors.toList());
        }

        OrderDto.PaymentResponse payment = null;
        if (order.getPaymentMethod() == PaymentMethod.BANK_TRANSFER_QR) {
            payment = OrderDto.PaymentResponse.builder()
                    .bankId(vietQrService.getBankId())
                    .bankName(vietQrService.getBankName())
                    .accountNo(vietQrService.getAccountNo())
                    .accountName(vietQrService.getAccountName())
                    .amount(order.getFinalAmount())
                    .content(order.getOrderCode())
                    .qrPayload(vietQrService.generateEmvCoPayload(order.getFinalAmount(), order.getOrderCode()))
                    .qrImageUrl(vietQrService.generateQrImageUrl(order.getFinalAmount(), order.getOrderCode()))
                    .build();
        }

        return OrderDto.Response.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .customerName(order.getCustomerName())
                .phone(order.getPhone())
                .shippingAddress(order.getShippingAddress())
                .city(order.getCity())
                .paymentMethod(order.getPaymentMethod().name())
                .paymentStatus(order.getPaymentStatus().name())
                .orderStatus(order.getOrderStatus().name())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .couponCode(order.getCouponCode())
                .shippingFee(order.getShippingFee())
                .finalAmount(order.getFinalAmount())
                .note(order.getNote())
                .createdAt(order.getCreatedAt().toString())
                .updatedAt(order.getUpdatedAt().toString())
                .items(itemDtos)
                .payment(payment)
                .build();
    }

    private String generateOrderCode() {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder("LK" + datePrefix);
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(ThreadLocalRandom.current().nextInt(chars.length())));
        }
        return sb.toString();
    }
}
