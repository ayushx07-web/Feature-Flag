package com.featureflags.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.featureflags.model.entity.AuditLog;
import com.featureflags.model.entity.FeatureFlag;
import com.featureflags.model.entity.Project;
import com.featureflags.model.entity.User;
import com.featureflags.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public void logAction(Project project, FeatureFlag flag, User user, String action, Object oldValue, Object newValue) {
        Map<String, Object> oldValMap = oldValue != null ? objectMapper.convertValue(oldValue, Map.class) : null;
        Map<String, Object> newValMap = newValue != null ? objectMapper.convertValue(newValue, Map.class) : null;

        AuditLog log = AuditLog.builder()
                .project(project)
                .flag(flag)
                .changedBy(user)
                .action(action)
                .oldValue(oldValMap)
                .newValue(newValMap)
                .build();

        auditLogRepository.save(log);
    }
}
