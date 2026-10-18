package com.linhkien.iotai.repository;

import com.linhkien.iotai.entity.IotAlert;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IotAlertRepository extends JpaRepository<IotAlert, Long> {
    List<IotAlert> findByDeviceIdOrderByCreatedAtDesc(Long deviceId, Pageable pageable);

    @Query("SELECT a FROM IotAlert a ORDER BY a.createdAt DESC")
    List<IotAlert> findRecentAlerts(Pageable pageable);

    @Query("SELECT a FROM IotAlert a WHERE a.device.deviceCode = :deviceCode ORDER BY a.createdAt DESC")
    List<IotAlert> findByDeviceCodeOrderByCreatedAtDesc(@Param("deviceCode") String deviceCode, Pageable pageable);
}
