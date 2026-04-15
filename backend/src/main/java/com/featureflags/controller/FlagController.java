package com.featureflags.controller;

import com.featureflags.model.dto.ApiResponse;
import com.featureflags.model.dto.FeatureFlagDto;
import com.featureflags.model.dto.TargetingRuleDto;
import com.featureflags.model.entity.FeatureFlag;
import com.featureflags.model.entity.TargetingRule;
import com.featureflags.model.entity.User;
import com.featureflags.service.FlagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/flags")
@RequiredArgsConstructor
public class FlagController {

    private final FlagService flagService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeatureFlagDto.Response>>> getFlags(@PathVariable UUID projectId) {
        List<FeatureFlagDto.Response> res = flagService.getAllFlagsForProject(projectId).stream()
                .map(this::mapFlagToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FeatureFlagDto.Response>> createFlag(
            @PathVariable UUID projectId,
            @Valid @RequestBody FeatureFlagDto.CreateRequest request,
            @AuthenticationPrincipal User user) {
        FeatureFlag flag = flagService.createFlag(projectId, request, user);
        return ResponseEntity.ok(ApiResponse.success(mapFlagToDto(flag)));
    }

    @GetMapping("/{flagId}")
    public ResponseEntity<ApiResponse<FeatureFlagDto.Response>> getFlag(@PathVariable UUID projectId, @PathVariable UUID flagId) {
        FeatureFlag flag = flagService.getFlag(projectId, flagId);
        return ResponseEntity.ok(ApiResponse.success(mapFlagToDto(flag)));
    }

    @PutMapping("/{flagId}")
    public ResponseEntity<ApiResponse<FeatureFlagDto.Response>> updateFlag(
            @PathVariable UUID projectId,
            @PathVariable UUID flagId,
            @Valid @RequestBody FeatureFlagDto.UpdateRequest request,
            @AuthenticationPrincipal User user) {
        FeatureFlag flag = flagService.updateFlag(projectId, flagId, request, user);
        return ResponseEntity.ok(ApiResponse.success(mapFlagToDto(flag)));
    }

    @PatchMapping("/{flagId}/toggle")
    public ResponseEntity<ApiResponse<FeatureFlagDto.Response>> toggleFlag(
            @PathVariable UUID projectId,
            @PathVariable UUID flagId,
            @AuthenticationPrincipal User user) {
        FeatureFlag flag = flagService.toggleFlag(projectId, flagId, user);
        return ResponseEntity.ok(ApiResponse.success(mapFlagToDto(flag)));
    }

    @DeleteMapping("/{flagId}")
    public ResponseEntity<ApiResponse<Void>> deleteFlag(
            @PathVariable UUID projectId,
            @PathVariable UUID flagId,
            @AuthenticationPrincipal User user) {
        flagService.deleteFlag(projectId, flagId, user);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // Rules matching
    
    @GetMapping("/{flagId}/rules")
    public ResponseEntity<ApiResponse<List<TargetingRuleDto.Response>>> getRules(@PathVariable UUID projectId, @PathVariable UUID flagId) {
        FeatureFlag flag = flagService.getFlag(projectId, flagId);
        List<TargetingRuleDto.Response> res = flag.getRules().stream()
                .map(this::mapRuleToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PostMapping("/{flagId}/rules")
    public ResponseEntity<ApiResponse<TargetingRuleDto.Response>> addRule(
            @PathVariable UUID projectId,
            @PathVariable UUID flagId,
            @Valid @RequestBody TargetingRuleDto.Request request,
            @AuthenticationPrincipal User user) {
        TargetingRule rule = flagService.addRule(projectId, flagId, request, user);
        return ResponseEntity.ok(ApiResponse.success(mapRuleToDto(rule)));
    }

    @PutMapping("/{flagId}/rules/{ruleId}")
    public ResponseEntity<ApiResponse<TargetingRuleDto.Response>> updateRule(
            @PathVariable UUID projectId,
            @PathVariable UUID flagId,
            @PathVariable UUID ruleId,
            @Valid @RequestBody TargetingRuleDto.Request request,
            @AuthenticationPrincipal User user) {
        TargetingRule rule = flagService.updateRule(projectId, flagId, ruleId, request, user);
        return ResponseEntity.ok(ApiResponse.success(mapRuleToDto(rule)));
    }

    @DeleteMapping("/{flagId}/rules/{ruleId}")
    public ResponseEntity<ApiResponse<Void>> deleteRule(
            @PathVariable UUID projectId,
            @PathVariable UUID flagId,
            @PathVariable UUID ruleId,
            @AuthenticationPrincipal User user) {
        flagService.deleteRule(projectId, flagId, ruleId, user);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private FeatureFlagDto.Response mapFlagToDto(FeatureFlag f) {
        FeatureFlagDto.Response res = new FeatureFlagDto.Response();
        res.setId(f.getId().toString());
        res.setKey(f.getKey());
        res.setName(f.getName());
        res.setDescription(f.getDescription());
        res.setEnabled(f.isEnabled());
        res.setRolloutPercentage(f.getRolloutPercentage());
        res.setCreatedAt(f.getCreatedAt());
        res.setUpdatedAt(f.getUpdatedAt());
        if (f.getRules() != null) {
            res.setRules(f.getRules().stream().map(this::mapRuleToDto).collect(Collectors.toList()));
        }
        return res;
    }

    private TargetingRuleDto.Response mapRuleToDto(TargetingRule r) {
        TargetingRuleDto.Response res = new TargetingRuleDto.Response();
        res.setId(r.getId().toString());
        res.setAttribute(r.getAttribute());
        res.setOperator(r.getOperator());
        res.setValue(r.getValue());
        res.setRuleValue(r.isRuleValue());
        res.setPriority(r.getPriority());
        return res;
    }
}
