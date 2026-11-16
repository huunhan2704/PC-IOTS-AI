package com.linhkien.iotai.dto.admin;

import com.linhkien.iotai.dto.iot.IotDto;
import com.linhkien.iotai.dto.product.ProductDto;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

public class AdminDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenueByTime {
        private String label; // "dd/MM" or "MM/yyyy"
        private BigDecimal revenue;
        private Long orders;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryShare {
        private String name;
        private BigDecimal value;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopProductItem {
        private Long productId;
        private String name;
        private Long quantity;
        private BigDecimal revenue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardResponse {
        private BigDecimal totalRevenue;
        private BigDecimal monthRevenue;
        private Long totalOrders;
        private Long pendingOrders;
        private Long lowStockCount;
        private Long productsCount;
        private Long customersCount;
        private Long onlineDevices;
        private Long totalDevices;
        private List<RevenueByTime> revenueByDay;
        private List<RevenueByTime> revenueByMonth;
        private List<CategoryShare> categoryShare;
        private List<TopProductItem> topProducts;
        private List<IotDto.AlertResponse> recentAlerts;
        private List<ProductDto.Response> lowStockProducts;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductSalesItem {
        private Long productId;
        private String productName;
        private String categoryName;
        private String brand;
        private Long quantitySold;
        private BigDecimal revenue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenueReportResponse {
        private String startDate;
        private String endDate;
        private BigDecimal totalRevenue;
        private Long totalOrders;
        private Long completedOrders;
        private Long cancelledOrders;
        private Long totalItemsSold;
        private BigDecimal averageOrderValue;
        private List<RevenueByTime> revenueByDay;
        private List<RevenueByTime> revenueByMonth;
        private List<CategoryShare> categoryShare;
        private List<ProductSalesItem> productSales;
        private List<com.linhkien.iotai.dto.order.OrderDto.Response> orders;
    }
}
