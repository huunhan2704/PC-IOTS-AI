package com.linhkien.iotai.entity;

import com.linhkien.iotai.entity.enums.DiscountType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @Column(length = 50)
    private String code;

    @Column(nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "max_discount", precision = 15, scale = 2)
    private BigDecimal maxDiscount;

    @Column(name = "min_order", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal minOrder = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
