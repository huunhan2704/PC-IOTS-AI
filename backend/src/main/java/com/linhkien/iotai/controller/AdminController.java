package com.linhkien.iotai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.linhkien.iotai.dto.ApiResponse;
import com.linhkien.iotai.dto.PageResponse;
import com.linhkien.iotai.dto.admin.AdminDto;
import com.linhkien.iotai.dto.iot.IotDto;
import com.linhkien.iotai.dto.order.OrderDto;
import com.linhkien.iotai.dto.product.ProductDto;
import com.linhkien.iotai.entity.*;
import com.linhkien.iotai.entity.enums.DeviceStatus;
import com.linhkien.iotai.entity.enums.OrderStatus;
import com.linhkien.iotai.entity.enums.Role;
import com.linhkien.iotai.exception.ResourceNotFoundException;
import com.linhkien.iotai.repository.*;
import com.linhkien.iotai.security.UserPrincipal;
import com.linhkien.iotai.service.GeneralAppService;
import com.linhkien.iotai.service.OrderService;
import com.linhkien.iotai.service.ProductMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final GeneralAppService generalAppService;
    private final OrderService orderService;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final IotDeviceRepository deviceRepository;
    private final IotAlertRepository alertRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProductMapper productMapper;
    private final ObjectMapper objectMapper;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminDto.DashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(generalAppService.getAdminDashboard()));
    }

    @GetMapping("/revenue-report")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminDto.RevenueReportResponse>> getRevenueReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        java.time.LocalDate start = (startDate != null && !startDate.isBlank()) ? java.time.LocalDate.parse(startDate) : null;
        java.time.LocalDate end = (endDate != null && !endDate.isBlank()) ? java.time.LocalDate.parse(endDate) : null;
        return ResponseEntity.ok(ApiResponse.ok(generalAppService.getRevenueReport(start, end)));
    }

    @GetMapping("/products")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<PageResponse<ProductDto.Response>>> getAdminProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Specification<Product> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.toLowerCase().trim() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("brand")), like)
                ));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(root.get("category").get("slug"), category.toLowerCase().trim()));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<ProductDto.Response> result = productRepository.findAll(spec, pageable).map(productMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.<ProductDto.Response>builder()
                .content(result.getContent())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build()));
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<ProductDto.Response>> createProduct(@RequestBody ProductDto.SaveProductRequest req) {
        Category cat = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại"));

        String slug = req.getSlug() != null && !req.getSlug().isBlank() ? req.getSlug() :
                req.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + System.currentTimeMillis();

        Product product = Product.builder()
                .category(cat)
                .name(req.getName())
                .slug(slug)
                .brand(req.getBrand())
                .price(req.getPrice())
                .originalPrice(req.getOriginalPrice())
                .stockQuantity(req.getStockQuantity() != null ? req.getStockQuantity() : 0)
                .warrantyMonths(req.getWarrantyMonths() != null ? req.getWarrantyMonths() : 12)
                .imageUrl(req.getImageUrl())
                .description(req.getDescription())
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();

        Product saved = productRepository.save(product);

        if (req.getSpecs() != null) {
            ProductSpec spec = ProductSpec.builder()
                    .product(saved)
                    .socket(req.getSpecs().getSocket())
                    .ramGeneration(req.getSpecs().getRamGeneration())
                    .ramBus(req.getSpecs().getRamBus())
                    .formFactor(req.getSpecs().getFormFactor())
                    .tdp(req.getSpecs().getTdp() != null ? req.getSpecs().getTdp() : 0)
                    .psuWattage(req.getSpecs().getPsuWattage())
                    .psuEfficiency(req.getSpecs().getPsuEfficiency())
                    .vram(req.getSpecs().getVram())
                    .storageInterface(req.getSpecs().getStorageInterface())
                    .coolingType(req.getSpecs().getCoolingType())
                    .dimensions(req.getSpecs().getDimensions())
                    .coolerTdpRating(req.getSpecs().getCoolerTdpRating())
                    .gpuLengthMm(req.getSpecs().getGpuLengthMm())
                    .maxGpuLengthMm(req.getSpecs().getMaxGpuLengthMm())
                    .supportedFormFactors(req.getSpecs().getSupportedFormFactors())
                    .cores(req.getSpecs().getCores())
                    .threads(req.getSpecs().getThreads())
                    .baseClock(req.getSpecs().getBaseClock())
                    .boostClock(req.getSpecs().getBoostClock())
                    .capacityGb(req.getSpecs().getCapacityGb())
                    .build();

            if (req.getSpecs().getTechnicalJson() != null) {
                try {
                    spec.setTechnicalJson(objectMapper.writeValueAsString(req.getSpecs().getTechnicalJson()));
                } catch (Exception ignored) {}
            }
            saved.setSpecs(spec);
            saved = productRepository.save(saved);
        }

        return ResponseEntity.ok(ApiResponse.ok("Thêm sản phẩm mới thành công", productMapper.toResponse(saved)));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductDto.Response>> updateProduct(
            @PathVariable Long id,
            @RequestBody ProductDto.SaveProductRequest req) {
        Product product = productRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + id));

        if (req.getCategoryId() != null) {
            Category cat = categoryRepository.findById(req.getCategoryId()).orElse(null);
            if (cat != null) product.setCategory(cat);
        }

        if (req.getName() != null) product.setName(req.getName());
        if (req.getBrand() != null) product.setBrand(req.getBrand());
        if (req.getPrice() != null) product.setPrice(req.getPrice());
        if (req.getOriginalPrice() != null) product.setOriginalPrice(req.getOriginalPrice());
        if (req.getStockQuantity() != null) product.setStockQuantity(req.getStockQuantity());
        if (req.getWarrantyMonths() != null) product.setWarrantyMonths(req.getWarrantyMonths());
        if (req.getImageUrl() != null) product.setImageUrl(req.getImageUrl());
        if (req.getDescription() != null) product.setDescription(req.getDescription());
        if (req.getIsActive() != null) product.setIsActive(req.getIsActive());

        return ResponseEntity.ok(ApiResponse.ok("Cập nhật sản phẩm thành công", productMapper.toResponse(productRepository.save(product))));
    }

    @PatchMapping("/products/{id}/stock")
    public ResponseEntity<ApiResponse<ProductDto.Response>> updateStock(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody ProductDto.UpdateStockRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật tồn kho thành công", generalAppService.updateStock(id, user.getId(), req)));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));
        p.setIsActive(false);
        productRepository.save(p);
        return ResponseEntity.ok(ApiResponse.ok("Đã vô hiệu hóa sản phẩm", null));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<PageResponse<OrderDto.Response>>> getAdminOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Specification<Order> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("orderStatus"), OrderStatus.valueOf(status.toUpperCase().trim())));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.toLowerCase().trim() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("orderCode")), like),
                        cb.like(cb.lower(root.get("customerName")), like),
                        cb.like(cb.lower(root.get("phone")), like)
                ));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<OrderDto.Response> result = orderRepository.findAll(spec, pageable).map(orderService::toOrderResponse);

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.<OrderDto.Response>builder()
                .content(result.getContent())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build()));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<OrderDto.Response>> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody OrderDto.UpdateStatusRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái đơn hàng thành công", orderService.updateOrderStatus(id, req.getStatus())));
    }

    @PatchMapping("/orders/{id}/payment")
    public ResponseEntity<ApiResponse<OrderDto.Response>> updateOrderPayment(
            @PathVariable Long id,
            @RequestBody OrderDto.UpdatePaymentRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thanh toán thành công", orderService.updatePaymentStatus(id, req.getPaymentStatus())));
    }

    @PostMapping("/orders/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderDto.Response>> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody(required = false) OrderDto.CancelOrderRequest req) {
        String reason = req != null && req.getReason() != null ? req.getReason() : "Quản trị viên hủy đơn";
        return ResponseEntity.ok(ApiResponse.ok("Hủy đơn và hoàn tồn kho thành công", orderService.cancelOrder(id, user.getId(), reason, true)));
    }

    @GetMapping("/devices")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ApiResponse<List<IotDto.DeviceResponse>>> getDevices() {
        return ResponseEntity.ok(ApiResponse.ok(generalAppService.getUserDevices(null, "ROLE_ADMIN")));
    }

    @GetMapping("/users/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUserSummaries() {
        List<Map<String, Object>> users = userRepository.findAll(Sort.by("id").ascending()).stream()
                .map(u -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    m.put("fullName", u.getFullName());
                    m.put("role", u.getRole().name());
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PostMapping("/devices")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ApiResponse<IotDto.DeviceResponse>> createDevice(@RequestBody Map<String, Object> req,
                                                                           @AuthenticationPrincipal UserPrincipal user) {
        String deviceCode = (String) req.get("deviceCode");
        if (deviceCode == null || deviceCode.isBlank()) {
            throw new IllegalArgumentException("Mã thiết bị (deviceCode) không được để trống");
        }
        if (deviceRepository.findByDeviceCode(deviceCode.trim()).isPresent()) {
            throw new IllegalArgumentException("Mã thiết bị đã tồn tại: " + deviceCode);
        }

        IotDevice device = IotDevice.builder()
                .deviceCode(deviceCode.trim().toUpperCase())
                .deviceName((String) req.getOrDefault("deviceName", "Thiết bị IoT mới"))
                .macAddress((String) req.get("macAddress"))
                .esp32Ip((String) req.get("esp32Ip"))
                .roomLocation((String) req.getOrDefault("roomLocation", "Phòng kỹ thuật"))
                .status(DeviceStatus.OFFLINE)
                .currentScenario((String) req.getOrDefault("currentScenario", "IDLE"))
                .build();

        if (req.get("userId") != null) {
            Long ownerId = ((Number) req.get("userId")).longValue();
            userRepository.findById(ownerId).ifPresent(device::setUser);
        } else if (user != null) {
            userRepository.findById(user.getId()).ifPresent(device::setUser);
        }

        IotDevice saved = deviceRepository.save(device);
        IotDto.DeviceResponse res = IotDto.DeviceResponse.builder()
                .id(saved.getId())
                .userId(saved.getUser() != null ? saved.getUser().getId() : null)
                .ownerName(saved.getUser() != null ? saved.getUser().getFullName() : null)
                .deviceCode(saved.getDeviceCode())
                .deviceName(saved.getDeviceName())
                .macAddress(saved.getMacAddress())
                .status(saved.getStatus().name())
                .esp32Ip(saved.getEsp32Ip())
                .roomLocation(saved.getRoomLocation())
                .currentScenario(saved.getCurrentScenario())
                .build();
        return ResponseEntity.ok(ApiResponse.ok("Thêm thiết bị IoT mới thành công (Trạng thái ban đầu: OFFLINE)", res));
    }

    @PutMapping("/devices/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ApiResponse<IotDto.DeviceResponse>> updateDevice(@PathVariable Long id,
                                                                           @RequestBody Map<String, Object> req) {
        IotDevice device = deviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thiết bị IoT không tồn tại: " + id));

        if (req.get("deviceName") != null) device.setDeviceName((String) req.get("deviceName"));
        if (req.get("macAddress") != null) device.setMacAddress((String) req.get("macAddress"));
        if (req.get("esp32Ip") != null) device.setEsp32Ip((String) req.get("esp32Ip"));
        if (req.get("roomLocation") != null) device.setRoomLocation((String) req.get("roomLocation"));
        if (req.get("currentScenario") != null) device.setCurrentScenario((String) req.get("currentScenario"));
        if (req.get("userId") != null) {
            Long ownerId = ((Number) req.get("userId")).longValue();
            userRepository.findById(ownerId).ifPresent(device::setUser);
        }

        IotDevice saved = deviceRepository.save(device);
        IotDto.DeviceResponse res = IotDto.DeviceResponse.builder()
                .id(saved.getId())
                .userId(saved.getUser() != null ? saved.getUser().getId() : null)
                .ownerName(saved.getUser() != null ? saved.getUser().getFullName() : null)
                .deviceCode(saved.getDeviceCode())
                .deviceName(saved.getDeviceName())
                .macAddress(saved.getMacAddress())
                .status(saved.getStatus().name())
                .esp32Ip(saved.getEsp32Ip())
                .roomLocation(saved.getRoomLocation())
                .currentScenario(saved.getCurrentScenario())
                .build();
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thiết bị IoT thành công", res));
    }

    @DeleteMapping("/devices/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ApiResponse<Void>> deleteDevice(@PathVariable Long id) {
        IotDevice device = deviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thiết bị IoT không tồn tại: " + id));
        deviceRepository.delete(device);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa thiết bị IoT thành công", null));
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ApiResponse<List<IotDto.AlertResponse>>> getRecentAlerts() {
        List<IotDto.AlertResponse> list = alertRepository.findRecentAlerts(PageRequest.of(0, 100)).stream()
                .map(a -> IotDto.AlertResponse.builder()
                        .id(a.getId())
                        .deviceCode(a.getDevice().getDeviceCode())
                        .type(a.getType())
                        .severity(a.getSeverity().name())
                        .message(a.getMessage())
                        .value(a.getValue())
                        .createdAt(a.getCreatedAt().toString())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    // ==================== USER & ROLE MANAGEMENT (ADMIN ONLY) ====================

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllUsers() {
        List<Map<String, Object>> users = userRepository.findAll(Sort.by("id").ascending()).stream()
                .map(u -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    m.put("fullName", u.getFullName());
                    m.put("email", u.getEmail());
                    m.put("phone", u.getPhone());
                    m.put("role", u.getRole().name());
                    m.put("isActive", u.getIsActive());
                    m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createUser(@RequestBody Map<String, Object> req) {
        String username = ((String) req.get("username")).trim();
        String email = ((String) req.get("email")).trim().toLowerCase();
        String password = (String) req.getOrDefault("password", "123456");
        String fullName = (String) req.get("fullName");
        String phone = req.get("phone") != null ? ((String) req.get("phone")).trim() : "";
        String roleStr = (String) req.getOrDefault("role", "ROLE_CUSTOMER");

        if (!email.matches("^[a-zA-Z0-9._%+-]+@gmail\\.com$")) {
            throw new com.linhkien.iotai.exception.BadRequestException("Email bắt buộc phải có định dạng @gmail.com");
        }
        if (!phone.isEmpty() && !phone.matches("^0\\d{9}$")) {
            throw new com.linhkien.iotai.exception.BadRequestException("Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0");
        }
        if (userRepository.existsByUsername(username)) {
            throw new com.linhkien.iotai.exception.BadRequestException("Tên đăng nhập đã tồn tại");
        }
        if (userRepository.existsByEmail(email)) {
            throw new com.linhkien.iotai.exception.BadRequestException("Email đã tồn tại");
        }
        if (!phone.isEmpty() && userRepository.existsByPhone(phone)) {
            throw new com.linhkien.iotai.exception.BadRequestException("Số điện thoại đã tồn tại");
        }

        User newUser = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(password))
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .role(Role.valueOf(roleStr))
                .isActive(true)
                .build();

        User saved = userRepository.save(newUser);
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id", saved.getId());
        m.put("username", saved.getUsername());
        m.put("fullName", saved.getFullName());
        m.put("email", saved.getEmail());
        m.put("phone", saved.getPhone());
        m.put("role", saved.getRole().name());
        m.put("isActive", saved.getIsActive());
        return ResponseEntity.ok(ApiResponse.ok("Tạo tài khoản nhân viên/người dùng thành công", m));
    }

    @PatchMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> req) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + id));
        target.setRole(Role.valueOf(req.get("role")));
        userRepository.save(target);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật phân quyền thành công", null));
    }

    @PatchMapping("/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> toggleUserStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> req) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + id));
        target.setIsActive(Boolean.TRUE.equals(req.get("isActive")));
        userRepository.save(target);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái tài khoản thành công", null));
    }
}
