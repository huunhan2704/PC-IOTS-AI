package com.linhkien.iotai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.linhkien.iotai.dto.admin.AdminDto;
import com.linhkien.iotai.dto.auth.AuthDto;
import com.linhkien.iotai.dto.iot.IotDto;
import com.linhkien.iotai.dto.order.OrderDto;
import com.linhkien.iotai.dto.pcbuilder.PcBuilderDto;
import com.linhkien.iotai.dto.product.ProductDto;
import com.linhkien.iotai.entity.*;
import com.linhkien.iotai.entity.enums.DeviceStatus;
import com.linhkien.iotai.entity.enums.OrderStatus;
import com.linhkien.iotai.entity.enums.Role;
import com.linhkien.iotai.exception.BadRequestException;
import com.linhkien.iotai.exception.ResourceNotFoundException;
import com.linhkien.iotai.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeneralAppService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final IotDeviceRepository deviceRepository;
    private final IotAlertRepository alertRepository;
    private final PcBuildRepository pcBuildRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final ProductMapper productMapper;
    private final PcBuilderService pcBuilderService;
    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    // --- PRODUCTS & CATEGORIES ---

    @Transactional(readOnly = true)
    public List<ProductDto.CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(productMapper::toCategoryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ProductDto.Response> getProducts(
            String keyword, String categorySlug, List<String> brands,
            BigDecimal minPrice, BigDecimal maxPrice, String socket,
            String ramGen, Boolean inStock, String sort, Pageable pageable) {

        Specification<Product> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("isActive")));

            if (keyword != null && !keyword.isBlank()) {
                jakarta.persistence.criteria.Join<Object, Object> categoryJoin = root.join("category", jakarta.persistence.criteria.JoinType.LEFT);
                jakarta.persistence.criteria.Join<Object, Object> specsJoin = root.join("specs", jakarta.persistence.criteria.JoinType.LEFT);
                String[] tokens = keyword.toLowerCase().trim().split("\\s+");
                for (String token : tokens) {
                    if (token.isBlank() || "socket".equals(token)) continue;
                    String like = "%" + token + "%";
                    predicates.add(cb.or(
                            cb.like(cb.lower(root.get("name")), like),
                            cb.like(cb.lower(root.get("brand")), like),
                            cb.like(cb.lower(categoryJoin.get("name")), like),
                            cb.like(cb.lower(categoryJoin.get("slug")), like),
                            cb.like(cb.lower(specsJoin.get("socket")), like),
                            cb.like(cb.lower(specsJoin.get("ramGeneration")), like),
                            cb.like(cb.lower(specsJoin.get("formFactor")), like)
                    ));
                }
            }

            if (categorySlug != null && !categorySlug.isBlank()) {
                predicates.add(cb.equal(root.get("category").get("slug"), categorySlug.toLowerCase().trim()));
            }

            if (brands != null && !brands.isEmpty()) {
                predicates.add(root.get("brand").in(brands));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            if (socket != null && !socket.isBlank()) {
                predicates.add(cb.equal(root.get("specs").get("socket"), socket));
            }

            if (ramGen != null && !ramGen.isBlank()) {
                predicates.add(cb.equal(root.get("specs").get("ramGeneration"), ramGen));
            }

            if (Boolean.TRUE.equals(inStock)) {
                predicates.add(cb.greaterThan(root.get("stockQuantity"), 0));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Pageable sortedPageable = pageable;
        if ("price_asc".equalsIgnoreCase(sort)) {
            sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("price").ascending());
        } else if ("price_desc".equalsIgnoreCase(sort)) {
            sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("price").descending());
        } else if ("name".equalsIgnoreCase(sort)) {
            sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("name").ascending());
        } else {
            sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("createdAt").descending());
        }

        return productRepository.findAll(spec, sortedPageable).map(productMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<ProductDto.Suggestion> searchSuggestions(String q) {
        if (q == null || q.isBlank()) return Collections.emptyList();
        Specification<Product> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("isActive")));
            jakarta.persistence.criteria.Join<Object, Object> categoryJoin = root.join("category", jakarta.persistence.criteria.JoinType.LEFT);
            jakarta.persistence.criteria.Join<Object, Object> specsJoin = root.join("specs", jakarta.persistence.criteria.JoinType.LEFT);
            String[] tokens = q.toLowerCase().trim().split("\\s+");
            for (String token : tokens) {
                if (token.isBlank() || "socket".equals(token)) continue;
                String like = "%" + token + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("brand")), like),
                        cb.like(cb.lower(categoryJoin.get("name")), like),
                        cb.like(cb.lower(categoryJoin.get("slug")), like),
                        cb.like(cb.lower(specsJoin.get("socket")), like),
                        cb.like(cb.lower(specsJoin.get("ramGeneration")), like),
                        cb.like(cb.lower(specsJoin.get("formFactor")), like)
                ));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        return productRepository.findAll(spec, PageRequest.of(0, 8)).getContent().stream()
                .map(p -> ProductDto.Suggestion.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .slug(p.getSlug())
                        .imageUrl(p.getImageUrl())
                        .price(p.getPrice())
                        .categorySlug(p.getCategory() != null ? p.getCategory().getSlug() : "")
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getBrands() {
        return productRepository.findDistinctBrands();
    }

    @Transactional(readOnly = true)
    public ProductDto.Response getProductByIdOrSlug(String idOrSlug) {
        Product product;
        if (idOrSlug.matches("\\d+")) {
            product = productRepository.findByIdWithDetails(Long.parseLong(idOrSlug))
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + idOrSlug));
        } else {
            product = productRepository.findBySlugWithDetails(idOrSlug)
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại với slug: " + idOrSlug));
        }
        return productMapper.toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<ProductDto.ReviewResponse> getProductReviews(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(productMapper::toReviewResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductDto.ReviewResponse createReview(Long productId, Long userId, ProductDto.CreateReviewRequest req) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        if (req.getRating() == null || req.getRating() < 1 || req.getRating() > 5) {
            throw new BadRequestException("Đánh giá phải từ 1 đến 5 sao");
        }

        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(req.getRating())
                .comment(req.getComment())
                .createdAt(LocalDateTime.now())
                .build();

        return productMapper.toReviewResponse(reviewRepository.save(review));
    }

    // --- PC BUILDS SAVING ---

    @Transactional
    public PcBuilderDto.BuildResponse savePcBuild(Long userId, PcBuilderDto.SaveBuildRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        PcBuilderDto.BuildSelection sel = PcBuilderDto.BuildSelection.builder()
                .cpuId(req.getCpuId())
                .mainboardId(req.getMainboardId())
                .ramId(req.getRamId())
                .gpuId(req.getGpuId())
                .storageId(req.getStorageId())
                .psuId(req.getPsuId())
                .coolerId(req.getCoolerId())
                .caseId(req.getCaseId())
                .build();

        PcBuilderDto.CompatibilityReport report = pcBuilderService.validateBuild(sel);

        Product cpu = req.getCpuId() != null ? productRepository.findById(req.getCpuId()).orElse(null) : null;
        Product mb = req.getMainboardId() != null ? productRepository.findById(req.getMainboardId()).orElse(null) : null;
        Product ram = req.getRamId() != null ? productRepository.findById(req.getRamId()).orElse(null) : null;
        Product gpu = req.getGpuId() != null ? productRepository.findById(req.getGpuId()).orElse(null) : null;
        Product storage = req.getStorageId() != null ? productRepository.findById(req.getStorageId()).orElse(null) : null;
        Product psu = req.getPsuId() != null ? productRepository.findById(req.getPsuId()).orElse(null) : null;
        Product cooler = req.getCoolerId() != null ? productRepository.findById(req.getCoolerId()).orElse(null) : null;
        Product pcCase = req.getCaseId() != null ? productRepository.findById(req.getCaseId()).orElse(null) : null;

        String repJson = "";
        try {
            repJson = objectMapper.writeValueAsString(report);
        } catch (Exception ignored) {}

        PcBuild build = PcBuild.builder()
                .user(user)
                .buildName(req.getBuildName() != null && !req.getBuildName().isBlank() ? req.getBuildName() : "Cấu hình PC Custom")
                .cpu(cpu)
                .mainboard(mb)
                .ram(ram)
                .gpu(gpu)
                .storage(storage)
                .psu(psu)
                .cooler(cooler)
                .caseProduct(pcCase)
                .totalPrice(report.getTotalPrice())
                .totalTdp(report.getTotalTdp())
                .recommendedPsu(report.getRecommendedPsu())
                .isCompatible(report.isCompatible())
                .compatibilityReport(repJson)
                .createdAt(LocalDateTime.now())
                .build();

        PcBuild saved = pcBuildRepository.save(build);
        return toBuildResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PcBuilderDto.BuildResponse> getMyBuilds(Long userId) {
        return pcBuildRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toBuildResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteBuild(Long id, Long userId) {
        PcBuild build = pcBuildRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cấu hình PC không tồn tại"));
        if (!build.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền xóa cấu hình này");
        }
        pcBuildRepository.delete(build);
    }

    private PcBuilderDto.BuildResponse toBuildResponse(PcBuild b) {
        return PcBuilderDto.BuildResponse.builder()
                .id(b.getId())
                .buildName(b.getBuildName())
                .totalPrice(b.getTotalPrice())
                .totalTdp(b.getTotalTdp())
                .recommendedPsu(b.getRecommendedPsu())
                .isCompatible(b.getIsCompatible())
                .compatibilityReport(b.getCompatibilityReport())
                .createdAt(b.getCreatedAt().toString())
                .cpu(productMapper.toResponse(b.getCpu()))
                .mainboard(productMapper.toResponse(b.getMainboard()))
                .ram(productMapper.toResponse(b.getRam()))
                .gpu(productMapper.toResponse(b.getGpu()))
                .storage(productMapper.toResponse(b.getStorage()))
                .psu(productMapper.toResponse(b.getPsu()))
                .cooler(productMapper.toResponse(b.getCooler()))
                .caseProduct(productMapper.toResponse(b.getCaseProduct()))
                .build();
    }

    // --- IOT DEVICES ---

    @Transactional(readOnly = true)
    public List<IotDto.DeviceResponse> getUserDevices(Long userId, String role) {
        List<IotDevice> list;
        if (Role.ROLE_ADMIN.name().equals(role) || Role.ROLE_TECHNICIAN.name().equals(role)) {
            list = deviceRepository.findAll();
        } else {
            list = deviceRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        return list.stream().map(d -> IotDto.DeviceResponse.builder()
                .id(d.getId())
                .userId(d.getUser() != null ? d.getUser().getId() : null)
                .ownerName(d.getUser() != null ? d.getUser().getFullName() : null)
                .deviceCode(d.getDeviceCode())
                .deviceName(d.getDeviceName())
                .macAddress(d.getMacAddress())
                .status(d.getStatus().name())
                .esp32Ip(d.getEsp32Ip())
                .roomLocation(d.getRoomLocation())
                .lastPing(d.getLastPing() != null ? d.getLastPing().toString() : null)
                .currentScenario(d.getCurrentScenario())
                .currentCpu(productMapper.toResponse(d.getCurrentCpu()))
                .currentMainboard(productMapper.toResponse(d.getCurrentMainboard()))
                .currentRam(productMapper.toResponse(d.getCurrentRam()))
                .currentGpu(productMapper.toResponse(d.getCurrentGpu()))
                .currentPsu(productMapper.toResponse(d.getCurrentPsu()))
                .currentCooler(productMapper.toResponse(d.getCurrentCooler()))
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public IotDto.DeviceResponse createDevice(Long userId, IotDto.CreateDeviceRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        String code = "PC-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        IotDevice dev = IotDevice.builder()
                .user(user)
                .deviceCode(code)
                .deviceName(req.getDeviceName())
                .roomLocation(req.getRoomLocation())
                .macAddress(req.getMacAddress())
                .status(DeviceStatus.OFFLINE)
                .currentScenario("IDLE")
                .createdAt(LocalDateTime.now())
                .build();

        IotDevice saved = deviceRepository.save(dev);
        return getUserDevices(userId, user.getRole().name()).stream()
                .filter(d -> d.getId().equals(saved.getId()))
                .findFirst()
                .orElse(null);
    }

    // --- ADMIN MANAGEMENT (BR16) ---

    @Transactional(readOnly = true)
    public AdminDto.DashboardResponse getAdminDashboard() {
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        LocalDateTime firstDayOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        BigDecimal monthRevenue = orderRepository.calculateRevenueSince(firstDayOfMonth);

        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByOrderStatus(OrderStatus.CHO_XAC_NHAN);
        long lowStockCount = productRepository.countByStockQuantityLessThanAndIsActiveTrue(5);
        long productsCount = productRepository.count();
        long customersCount = userRepository.count();
        long onlineDevices = deviceRepository.countByStatus(DeviceStatus.ONLINE);
        long totalDevices = deviceRepository.count();

        // 14 days revenue
        LocalDateTime fourteenDaysAgo = LocalDate.now().minusDays(13).atStartOfDay();
        List<Order> recentOrders = orderRepository.findActiveOrdersSince(fourteenDaysAgo);
        Map<String, BigDecimal> dayRevMap = new LinkedHashMap<>();
        Map<String, Long> dayOrderMap = new LinkedHashMap<>();

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM");
        for (int i = 13; i >= 0; i--) {
            String label = LocalDate.now().minusDays(i).format(dtf);
            dayRevMap.put(label, BigDecimal.ZERO);
            dayOrderMap.put(label, 0L);
        }

        for (Order o : recentOrders) {
            String label = o.getCreatedAt().format(dtf);
            if (dayRevMap.containsKey(label)) {
                dayRevMap.put(label, dayRevMap.get(label).add(o.getFinalAmount()));
                dayOrderMap.put(label, dayOrderMap.get(label) + 1);
            }
        }

        List<AdminDto.RevenueByTime> revByDay = new ArrayList<>();
        dayRevMap.forEach((lbl, rev) -> revByDay.add(new AdminDto.RevenueByTime(lbl, rev, dayOrderMap.get(lbl))));

        // 6 months revenue
        List<AdminDto.RevenueByTime> revByMonth = new ArrayList<>();
        DateTimeFormatter mtf = DateTimeFormatter.ofPattern("MM/yyyy");
        for (int i = 5; i >= 0; i--) {
            LocalDate m = LocalDate.now().minusMonths(i);
            String label = m.format(mtf);
            revByMonth.add(new AdminDto.RevenueByTime(label, totalRevenue.divide(BigDecimal.valueOf(6), BigDecimal.ROUND_HALF_UP), (long) (totalOrders / 6 + 1)));
        }

        // Category Share
        List<AdminDto.CategoryShare> catShare = new ArrayList<>();
        for (Object[] row : orderItemRepository.findCategoryRevenueShare()) {
            catShare.add(new AdminDto.CategoryShare((String) row[0], (BigDecimal) row[1]));
        }

        // Top Selling Products
        List<AdminDto.TopProductItem> topProducts = new ArrayList<>();
        for (Object[] row : orderItemRepository.findTopSellingProducts(PageRequest.of(0, 5))) {
            topProducts.add(new AdminDto.TopProductItem((Long) row[0], (String) row[1], (Long) row[2], (BigDecimal) row[3]));
        }

        // Recent alerts
        List<IotDto.AlertResponse> recentAlerts = alertRepository.findRecentAlerts(PageRequest.of(0, 8)).stream()
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

        // Low stock products
        List<ProductDto.Response> lowStock = productRepository.findByStockQuantityLessThanAndIsActiveTrue(5).stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());

        return AdminDto.DashboardResponse.builder()
                .totalRevenue(totalRevenue)
                .monthRevenue(monthRevenue)
                .totalOrders(totalOrders)
                .pendingOrders(pendingOrders)
                .lowStockCount(lowStockCount)
                .productsCount(productsCount)
                .customersCount(customersCount)
                .onlineDevices(onlineDevices)
                .totalDevices(totalDevices)
                .revenueByDay(revByDay)
                .revenueByMonth(revByMonth)
                .categoryShare(catShare)
                .topProducts(topProducts)
                .recentAlerts(recentAlerts)
                .lowStockProducts(lowStock)
                .build();
    }

    @Transactional
    public ProductDto.Response updateStock(Long productId, Long adminId, ProductDto.UpdateStockRequest req) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));

        if (req.getQuantity() == null || req.getQuantity() <= 0) {
            throw new BadRequestException("Số lượng nhập kho phải lớn hơn 0");
        }

        product.setStockQuantity(product.getStockQuantity() + req.getQuantity());
        Product saved = productRepository.save(product);

        User admin = adminId != null ? userRepository.findById(adminId).orElse(null) : null;
        inventoryLogRepository.save(InventoryLog.builder()
                .product(saved)
                .admin(admin)
                .quantity(req.getQuantity())
                .note(req.getNote() != null ? req.getNote() : "Nhập thêm hàng vào kho")
                .createdAt(LocalDateTime.now())
                .build());

        return productMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public AdminDto.RevenueReportResponse getRevenueReport(LocalDate startDate, LocalDate endDate) {
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        LocalDate start = startDate != null ? startDate : end.minusDays(29);
        LocalDateTime startDt = start.atStartOfDay();
        LocalDateTime endDt = end.atTime(23, 59, 59);

        List<Order> allOrdersInRange = orderRepository.findAll(Sort.by("createdAt").descending()).stream()
                .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isBefore(startDt) && !o.getCreatedAt().isAfter(endDt))
                .collect(Collectors.toList());

        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalOrders = allOrdersInRange.size();
        long completedOrders = 0;
        long cancelledOrders = 0;
        long totalItemsSold = 0;

        Map<Long, AdminDto.ProductSalesItem> productSalesMap = new LinkedHashMap<>();
        Map<String, BigDecimal> categoryRevMap = new LinkedHashMap<>();
        Map<String, BigDecimal> dayRevMap = new LinkedHashMap<>();
        Map<String, Long> dayOrderMap = new LinkedHashMap<>();

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM");
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            String lbl = d.format(dtf);
            dayRevMap.put(lbl, BigDecimal.ZERO);
            dayOrderMap.put(lbl, 0L);
        }

        List<OrderDto.Response> orderDtos = new ArrayList<>();

        for (Order o : allOrdersInRange) {
            if (o.getOrderStatus() == OrderStatus.DA_HUY) {
                cancelledOrders++;
            } else {
                if (o.getOrderStatus() == OrderStatus.DA_GIAO) {
                    completedOrders++;
                }
                totalRevenue = totalRevenue.add(o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO);

                String dayLbl = o.getCreatedAt().format(dtf);
                if (dayRevMap.containsKey(dayLbl)) {
                    dayRevMap.put(dayLbl, dayRevMap.get(dayLbl).add(o.getFinalAmount()));
                    dayOrderMap.put(dayLbl, dayOrderMap.get(dayLbl) + 1);
                }

                if (o.getItems() != null) {
                    for (OrderItem item : o.getItems()) {
                        totalItemsSold += item.getQuantity();
                        Product p = item.getProduct();
                        Long pid = p != null ? p.getId() : -1L;
                        String pName = item.getProductName();
                        String catName = (p != null && p.getCategory() != null) ? p.getCategory().getName() : "Khác";
                        String brand = p != null ? p.getBrand() : "";

                        AdminDto.ProductSalesItem psi = productSalesMap.computeIfAbsent(pid, k -> AdminDto.ProductSalesItem.builder()
                                .productId(pid)
                                .productName(pName)
                                .categoryName(catName)
                                .brand(brand)
                                .quantitySold(0L)
                                .revenue(BigDecimal.ZERO)
                                .build());
                        psi.setQuantitySold(psi.getQuantitySold() + item.getQuantity());
                        psi.setRevenue(psi.getRevenue().add(item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO));

                        categoryRevMap.merge(catName, item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO, BigDecimal::add);
                    }
                }
            }

            List<OrderDto.ItemResponse> itemDtos = o.getItems() != null ? o.getItems().stream()
                    .map(it -> OrderDto.ItemResponse.builder()
                            .id(it.getId())
                            .productId(it.getProduct() != null ? it.getProduct().getId() : null)
                            .productName(it.getProductName())
                            .imageUrl(it.getProduct() != null ? it.getProduct().getImageUrl() : null)
                            .unitPrice(it.getUnitPrice())
                            .quantity(it.getQuantity())
                            .subtotal(it.getSubtotal())
                            .build())
                    .collect(Collectors.toList()) : List.of();

            orderDtos.add(OrderDto.Response.builder()
                    .id(o.getId())
                    .orderCode(o.getOrderCode())
                    .customerName(o.getCustomerName())
                    .phone(o.getPhone())
                    .shippingAddress(o.getShippingAddress())
                    .city(o.getCity())
                    .paymentMethod(o.getPaymentMethod().name())
                    .paymentStatus(o.getPaymentStatus().name())
                    .orderStatus(o.getOrderStatus().name())
                    .totalAmount(o.getTotalAmount())
                    .discountAmount(o.getDiscountAmount())
                    .couponCode(o.getCouponCode())
                    .shippingFee(o.getShippingFee())
                    .finalAmount(o.getFinalAmount())
                    .note(o.getNote())
                    .createdAt(o.getCreatedAt().toString())
                    .items(itemDtos)
                    .build());
        }

        long activeOrdersCount = totalOrders - cancelledOrders;
        BigDecimal avgOrderValue = activeOrdersCount > 0
                ? totalRevenue.divide(BigDecimal.valueOf(activeOrdersCount), 0, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<AdminDto.RevenueByTime> revByDay = new ArrayList<>();
        dayRevMap.forEach((lbl, rev) -> revByDay.add(new AdminDto.RevenueByTime(lbl, rev, dayOrderMap.get(lbl))));

        List<AdminDto.CategoryShare> catShare = categoryRevMap.entrySet().stream()
                .map(e -> new AdminDto.CategoryShare(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        List<AdminDto.ProductSalesItem> productSales = productSalesMap.values().stream()
                .sorted(Comparator.comparing(AdminDto.ProductSalesItem::getRevenue).reversed())
                .collect(Collectors.toList());

        return AdminDto.RevenueReportResponse.builder()
                .startDate(start.toString())
                .endDate(end.toString())
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .totalItemsSold(totalItemsSold)
                .averageOrderValue(avgOrderValue)
                .revenueByDay(revByDay)
                .revenueByMonth(getAdminDashboard().getRevenueByMonth())
                .categoryShare(catShare)
                .productSales(productSales)
                .orders(orderDtos)
                .build();
    }
}
