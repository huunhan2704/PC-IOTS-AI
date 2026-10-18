package com.linhkien.iotai.repository;

import com.linhkien.iotai.entity.IotDevice;
import com.linhkien.iotai.entity.enums.DeviceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IotDeviceRepository extends JpaRepository<IotDevice, Long> {
    Optional<IotDevice> findByDeviceCode(String deviceCode);
    List<IotDevice> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByStatus(DeviceStatus status);
}
