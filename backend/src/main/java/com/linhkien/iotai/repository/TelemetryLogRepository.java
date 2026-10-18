package com.linhkien.iotai.repository;

import com.linhkien.iotai.entity.TelemetryLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TelemetryLogRepository extends JpaRepository<TelemetryLog, Long> {

    @Query("SELECT t FROM TelemetryLog t WHERE t.device.id = :deviceId AND t.recordedAt >= :since ORDER BY t.recordedAt ASC")
    List<TelemetryLog> findRecentByDeviceId(@Param("deviceId") Long deviceId, @Param("since") LocalDateTime since);

    @Query("SELECT t FROM TelemetryLog t WHERE t.device.id = :deviceId ORDER BY t.recordedAt DESC")
    List<TelemetryLog> findLatestByDeviceId(@Param("deviceId") Long deviceId, Pageable pageable);

    default Optional<TelemetryLog> findFirstLatestByDeviceId(Long deviceId) {
        List<TelemetryLog> list = findLatestByDeviceId(deviceId, Pageable.ofSize(1));
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Query("SELECT t FROM TelemetryLog t WHERE t.device.id = :deviceId AND t.recordedAt >= :since ORDER BY t.recordedAt DESC")
    List<TelemetryLog> findByDeviceIdAndRecordedAtAfter(@Param("deviceId") Long deviceId, @Param("since") LocalDateTime since);
}
