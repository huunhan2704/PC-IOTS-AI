package com.linhkien.iotai.repository;

import com.linhkien.iotai.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT oi.product.id, oi.productName, SUM(oi.quantity), SUM(oi.subtotal) " +
           "FROM OrderItem oi JOIN oi.order o " +
           "WHERE o.orderStatus <> 'DA_HUY' AND oi.product IS NOT NULL " +
           "GROUP BY oi.product.id, oi.productName " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingProducts(Pageable pageable);

    @Query("SELECT c.name, SUM(oi.subtotal) " +
           "FROM OrderItem oi JOIN oi.order o JOIN oi.product p JOIN p.category c " +
           "WHERE o.orderStatus <> 'DA_HUY' " +
           "GROUP BY c.name " +
           "ORDER BY SUM(oi.subtotal) DESC")
    List<Object[]> findCategoryRevenueShare();
}
