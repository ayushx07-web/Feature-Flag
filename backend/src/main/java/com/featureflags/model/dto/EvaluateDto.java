package com.featureflags.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class EvaluateDto {

    @Data
    public static class Request {
        @NotBlank
        private String flagKey;

        @NotBlank
        private String userId;

        private Map<String, String> userAttributes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private String flagKey;
        private boolean enabled;
        private String reason; // DISABLED | RULE_MATCH | ROLLOUT | DEFAULT_OFF | DEFAULT_ON
        private String ruleId;
    }

    @Data
    public static class BulkRequest {
        @NotBlank
        private String userId;

        private Map<String, String> userAttributes;

        private List<String> flagKeys;
    }
}
