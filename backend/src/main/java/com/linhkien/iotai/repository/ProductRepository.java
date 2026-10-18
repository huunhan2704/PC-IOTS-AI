package com.linhkien.iotai.repository;

import com.linhkien.iotai.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlug(String slug);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.specs LEFT JOIN FETCH p.images WHERE p.id = :id")
    Optional<Product> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.specs LEFT JOIN FETCH p.images WHERE p.slug = :slug")
    Optional<Product> findBySlugWithDetails(@Param("slug") String slug);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id IN :ids ORDER BY p.id ASC")
    List<Product> findAllByIdInForUpdate(@Param("ids") Collection<Long> ids);

    @Query("SELECT DISTINCT p.brand FROM Product p WHERE p.isActive = true ORDER BY p.brand ASC")
    List<String> findDistinctBrands();

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Product> searchSuggest(@Param("q") String query, Pageable pageable);

    @Query("SELECT p FROM Product p JOIN p.category c WHERE p.isActive = true AND c.slug = :categorySlug")
    List<Product> findByCategorySlug(@Param("categorySlug") String categorySlug);

    @Query("SELECT p FROM Product p JOIN p.category c WHERE p.isActive = true AND c.slug = :categorySlug AND p.specs.socket = :socket")
    List<Product> findByCategorySlugAndSocket(@Param("categorySlug") String categorySlug, @Param("socket") String socket);

    @Query("SELECT p FROM Product p JOIN p.category c WHERE p.isActive = true AND c.slug = :categorySlug AND p.specs.ramGeneration = :ramGen")
    List<Product> findByCategorySlugAndRamGen(@Param("categorySlug") String categorySlug, @Param("ramGen") String ramGen);

    long countByStockQuantityLessThanAndIsActiveTrue(int threshold);

    List<Product> findByStockQuantityLessThanAndIsActiveTrue(int threshold);
}
