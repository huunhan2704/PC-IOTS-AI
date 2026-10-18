package com.linhkien.iotai.repository;

import com.linhkien.iotai.entity.ProductSpec;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductSpecRepository extends JpaRepository<ProductSpec, Long> {
    Optional<ProductSpec> findByProductId(Long productId);
}
