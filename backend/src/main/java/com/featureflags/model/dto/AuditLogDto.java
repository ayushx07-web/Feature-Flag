package com.featureflags.model.dto;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.Map;

public class AuditLogDto {

    @Data
    public static class Response {
        private String id;
        private String action;
        private String flagId;
        private String changedByEmail;
        private Map<String, Object> oldValue;
        private Map<String, Object> newValue;
        private OffsetDateTime createdAt;
    }
}
