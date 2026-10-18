package com.linhkien.iotai.repository;

import com.linhkien.iotai.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, String> {
    Optional<Coupon> findByCodeIgnoreCaseAndIsActiveTrue(String code);
}
