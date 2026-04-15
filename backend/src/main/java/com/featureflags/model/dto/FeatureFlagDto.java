package com.featureflags.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

public class FeatureFlagDto {

    @Data
    public static class CreateRequest {
        @NotBlank
        @Pattern(regexp = "^[a-z0-9-]+$", message = "Key must be lowercase, alphanumeric with hyphens only")
        private String key;

        @NotBlank
        private String name;

        private String description;
    }

    @Data
    public static class UpdateRequest {
        @NotBlank
        private String name;

        private String description;

        private boolean enabled;

        @Min(0)
        @Max(100)
        private int rolloutPercentage;
    }

    @Data
    public static class Response {
        private String id;
        private String key;
        private String name;
        private String description;
        private boolean enabled;
        private int rolloutPercentage;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
        private List<TargetingRuleDto.Response> rules;
    }
}
