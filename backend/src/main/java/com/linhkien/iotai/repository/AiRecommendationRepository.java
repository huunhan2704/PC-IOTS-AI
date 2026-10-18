package com.linhkien.iotai.repository;

import com.linhkien.iotai.entity.AiRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiRecommendationRepository extends JpaRepository<AiRecommendation, Long> {
    List<AiRecommendation> findByDeviceIdOrderByCreatedAtDesc(Long deviceId);

    @Query("SELECT r FROM AiRecommendation r WHERE r.device.deviceCode = :deviceCode ORDER BY r.createdAt DESC")
    List<AiRecommendation> findByDeviceCodeOrderByCreatedAtDesc(@Param("deviceCode") String deviceCode);

    void deleteByDeviceId(Long deviceId);
}
