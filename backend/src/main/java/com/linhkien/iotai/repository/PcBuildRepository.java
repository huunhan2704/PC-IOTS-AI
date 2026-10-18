package com.linhkien.iotai.repository;

import com.linhkien.iotai.entity.PcBuild;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PcBuildRepository extends JpaRepository<PcBuild, Long> {
    List<PcBuild> findByUserIdOrderByCreatedAtDesc(Long userId);
}
