package com.featureflags.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class TargetingRuleDto {

    @Data
    public static class Request {
        @NotBlank
        private String attribute;

        @NotBlank
        private String operator; // EQUALS | NOT_EQUALS | CONTAINS | ENDS_WITH | STARTS_WITH | IN | NOT_IN

        @NotBlank
        private String value;

        private boolean ruleValue = true;

        private int priority = 0;
    }

    @Data
    public static class Response {
        private String id;
        private String attribute;
        private String operator;
        private String value;
        private boolean ruleValue;
        private int priority;
    }
}
