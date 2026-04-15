package com.featureflags.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.OffsetDateTime;

public class ProjectDto {

    @Data
    public static class Request {
        @NotBlank
        private String name;
        private String description;
    }

    @Data
    public static class Response {
        private String id;
        private String name;
        private String slug;
        private String description;
        private String apiKey;
        private OffsetDateTime createdAt;
        private int flagsCount;
    }
}
