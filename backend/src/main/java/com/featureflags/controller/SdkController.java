package com.featureflags.controller;

import com.featureflags.config.RateLimitConfig;
import com.featureflags.model.dto.ApiResponse;
import com.featureflags.model.entity.FeatureFlag;
import com.featureflags.model.entity.Project;
import com.featureflags.service.FlagService;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/sdk")
@RequiredArgsConstructor
public class SdkController {

    private final FlagService flagService;
    private final RateLimitConfig rateLimitConfig;

    @GetMapping("/flags")
    public ResponseEntity<ApiResponse<Map<String, List<String>>>> getFlagKeys(
            @AuthenticationPrincipal Project project) {
            
        Bucket bucket = rateLimitConfig.resolveBucket(project.getApiKey());
        if (!bucket.tryConsume(1)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiResponse.error("RATE_LIMIT_EXCEEDED", "Too many requests"));
        }

        List<String> flagKeys = flagService.getAllFlagsForProject(project.getId())
                .stream()
                .map(FeatureFlag::getKey)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(Map.of("flagKeys", flagKeys)));
    }
}
