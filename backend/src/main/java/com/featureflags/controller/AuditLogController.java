package com.featureflags.controller;

import com.featureflags.model.dto.ApiResponse;
import com.featureflags.model.dto.AuditLogDto;
import com.featureflags.model.entity.AuditLog;
import com.featureflags.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogDto.Response>>> getAuditLogs(
            @PathVariable UUID projectId,
            @RequestParam(required = false) UUID flagId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AuditLog> logPage;

        if (flagId != null) {
            logPage = auditLogRepository.findByProjectIdAndFlagId(projectId, flagId, pageable);
        } else {
            logPage = auditLogRepository.findByProjectId(projectId, pageable);
        }

        List<AuditLogDto.Response> res = logPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(res));
    }

    private AuditLogDto.Response mapToDto(AuditLog log) {
        AuditLogDto.Response dto = new AuditLogDto.Response();
        dto.setId(log.getId().toString());
        dto.setAction(log.getAction());
        dto.setFlagId(log.getFlag() != null ? log.getFlag().getId().toString() : null);
        dto.setChangedByEmail(log.getChangedBy() != null ? log.getChangedBy().getEmail() : "System");
        dto.setOldValue(log.getOldValue());
        dto.setNewValue(log.getNewValue());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
}
