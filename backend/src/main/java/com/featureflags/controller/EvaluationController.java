package com.featureflags.controller;

import com.featureflags.config.RateLimitConfig;
import com.featureflags.model.dto.ApiResponse;
import com.featureflags.model.dto.EvaluateDto;
import com.featureflags.model.entity.Project;
import com.featureflags.service.FlagEvaluationService;
import io.github.bucket4j.Bucket;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/evaluate")
@RequiredArgsConstructor
public class EvaluationController {

    private final FlagEvaluationService evaluationService;
    private final RateLimitConfig rateLimitConfig;

    @PostMapping
    public ResponseEntity<ApiResponse<EvaluateDto.Response>> evaluate(
            @Valid @RequestBody EvaluateDto.Request request,
            @AuthenticationPrincipal Project project) {
        
        Bucket bucket = rateLimitConfig.resolveBucket(project.getApiKey());
        if (!bucket.tryConsume(1)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiResponse.error("RATE_LIMIT_EXCEEDED", "Too many requests"));
        }

        EvaluateDto.Response response = evaluationService.evaluate(
                project, request.getFlagKey(), request.getUserId(), request.getUserAttributes()
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<Map<String, EvaluateDto.Response>>> evaluateBulk(
            @Valid @RequestBody EvaluateDto.BulkRequest request,
            @AuthenticationPrincipal Project project) {
            
        Bucket bucket = rateLimitConfig.resolveBucket(project.getApiKey());
        if (!bucket.tryConsume(1)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiResponse.error("RATE_LIMIT_EXCEEDED", "Too many requests"));
        }

        Map<String, EvaluateDto.Response> results = new HashMap<>();
        if (request.getFlagKeys() != null) {
            for (String key : request.getFlagKeys()) {
                EvaluateDto.Response res = evaluationService.evaluate(
                        project, key, request.getUserId(), request.getUserAttributes()
                );
                results.put(key, res);
            }
        }

        return ResponseEntity.ok(ApiResponse.success(results));
    }
}
