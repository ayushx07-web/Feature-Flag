package com.featureflags.repository;

import com.featureflags.model.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByProjectId(UUID projectId, Pageable pageable);
    Page<AuditLog> findByProjectIdAndFlagId(UUID projectId, UUID flagId, Pageable pageable);
}
