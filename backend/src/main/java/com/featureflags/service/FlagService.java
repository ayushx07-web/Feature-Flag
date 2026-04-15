package com.featureflags.service;

import com.featureflags.model.dto.FeatureFlagDto;
import com.featureflags.model.dto.TargetingRuleDto;
import com.featureflags.model.entity.FeatureFlag;
import com.featureflags.model.entity.Project;
import com.featureflags.model.entity.TargetingRule;
import com.featureflags.model.entity.User;
import com.featureflags.repository.FeatureFlagRepository;
import com.featureflags.repository.TargetingRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlagService {

    private final FeatureFlagRepository flagRepository;
    private final TargetingRuleRepository ruleRepository;
    private final ProjectService projectService;
    private final AuditLogService auditLogService;
    private final CacheInvalidationService cacheInvalidationService;

    public List<FeatureFlag> getAllFlagsForProject(UUID projectId) {
        return flagRepository.findByProjectId(projectId);
    }

    public FeatureFlag getFlag(UUID projectId, UUID flagId) {
        return flagRepository.findByIdAndProjectId(flagId, projectId)
                .orElseThrow(() -> new IllegalArgumentException("Flag not found"));
    }

    public FeatureFlag createFlag(UUID projectId, FeatureFlagDto.CreateRequest request, User user) {
        Project project = projectService.getProject(projectId);

        if (flagRepository.findByKeyAndProjectId(request.getKey(), projectId).isPresent()) {
            throw new IllegalArgumentException("Flag key already exists in this project");
        }

        FeatureFlag flag = FeatureFlag.builder()
                .project(project)
                .key(request.getKey())
                .name(request.getName())
                .description(request.getDescription())
                .enabled(false)
                .rolloutPercentage(0)
                .createdBy(user)
                .build();

        FeatureFlag saved = flagRepository.save(flag);
        auditLogService.logAction(project, saved, user, "FLAG_CREATED", null, Map.of("key", saved.getKey(), "name", saved.getName()));

        return saved;
    }

    public FeatureFlag updateFlag(UUID projectId, UUID flagId, FeatureFlagDto.UpdateRequest request, User user) {
        FeatureFlag flag = getFlag(projectId, flagId);
        
        Map<String, Object> oldVals = Map.of(
            "name", flag.getName(),
            "enabled", flag.isEnabled(),
            "rolloutPercentage", flag.getRolloutPercentage()
        );

        flag.setName(request.getName());
        flag.setDescription(request.getDescription());
        flag.setEnabled(request.isEnabled());
        flag.setRolloutPercentage(request.getRolloutPercentage());

        FeatureFlag saved = flagRepository.save(flag);
        
        cacheInvalidationService.invalidateFlagCache(projectId.toString(), saved.getKey());
        
        Map<String, Object> newVals = Map.of(
            "name", saved.getName(),
            "enabled", saved.isEnabled(),
            "rolloutPercentage", saved.getRolloutPercentage()
        );
        auditLogService.logAction(flag.getProject(), saved, user, "FLAG_UPDATED", oldVals, newVals);

        return saved;
    }

    public FeatureFlag toggleFlag(UUID projectId, UUID flagId, User user) {
        FeatureFlag flag = getFlag(projectId, flagId);
        boolean oldVal = flag.isEnabled();
        flag.setEnabled(!oldVal);
        
        FeatureFlag saved = flagRepository.save(flag);
        cacheInvalidationService.invalidateFlagCache(projectId.toString(), saved.getKey());
        
        auditLogService.logAction(flag.getProject(), saved, user, "FLAG_TOGGLED", Map.of("enabled", oldVal), Map.of("enabled", !oldVal));
        return saved;
    }

    public void deleteFlag(UUID projectId, UUID flagId, User user) {
        FeatureFlag flag = getFlag(projectId, flagId);
        flagRepository.delete(flag);
        cacheInvalidationService.invalidateFlagCache(projectId.toString(), flag.getKey());
        auditLogService.logAction(flag.getProject(), null, user, "FLAG_DELETED", Map.of("key", flag.getKey()), null);
    }

    public TargetingRule addRule(UUID projectId, UUID flagId, TargetingRuleDto.Request request, User user) {
        FeatureFlag flag = getFlag(projectId, flagId);

        TargetingRule rule = TargetingRule.builder()
                .flag(flag)
                .attribute(request.getAttribute())
                .operator(request.getOperator())
                .value(request.getValue())
                .ruleValue(request.isRuleValue())
                .priority(request.getPriority())
                .build();

        TargetingRule saved = ruleRepository.save(rule);
        cacheInvalidationService.invalidateFlagCache(projectId.toString(), flag.getKey());
        
        auditLogService.logAction(flag.getProject(), flag, user, "RULE_ADDED", null, Map.of("operator", saved.getOperator(), "value", saved.getValue()));
        return saved;
    }
    
    public TargetingRule updateRule(UUID projectId, UUID flagId, UUID ruleId, TargetingRuleDto.Request request, User user) {
        TargetingRule rule = ruleRepository.findByIdAndFlagId(ruleId, flagId)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found"));
        
        rule.setAttribute(request.getAttribute());
        rule.setOperator(request.getOperator());
        rule.setValue(request.getValue());
        rule.setRuleValue(request.isRuleValue());
        rule.setPriority(request.getPriority());

        TargetingRule saved = ruleRepository.save(rule);
        cacheInvalidationService.invalidateFlagCache(projectId.toString(), rule.getFlag().getKey());
        
        return saved;
    }

    public void deleteRule(UUID projectId, UUID flagId, UUID ruleId, User user) {
        TargetingRule rule = ruleRepository.findByIdAndFlagId(ruleId, flagId)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found"));
        
        ruleRepository.delete(rule);
        cacheInvalidationService.invalidateFlagCache(projectId.toString(), rule.getFlag().getKey());
        
        auditLogService.logAction(rule.getFlag().getProject(), rule.getFlag(), user, "RULE_DELETED", Map.of("ruleId", ruleId.toString()), null);
    }
}
