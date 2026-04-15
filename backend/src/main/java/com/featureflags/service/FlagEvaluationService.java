package com.featureflags.service;

import com.featureflags.model.dto.EvaluateDto;
import com.featureflags.model.entity.FeatureFlag;
import com.featureflags.model.entity.Project;
import com.featureflags.model.entity.TargetingRule;
import com.featureflags.repository.FeatureFlagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FlagEvaluationService {

    private final FeatureFlagRepository flagRepository;

    @Cacheable(value = "flags", key = "#project.id.toString() + ':' + #flagKey", unless = "#result == null")
    public FeatureFlag getFlagDataForEval(Project project, String flagKey) {
        return flagRepository.findByKeyAndProjectId(flagKey, project.getId()).orElse(null);
    }

    public EvaluateDto.Response evaluate(Project project, String flagKey, String userId, Map<String, String> attributes) {
        FeatureFlag flag = getFlagDataForEval(project, flagKey);

        if (flag == null) {
            return EvaluateDto.Response.builder()
                    .flagKey(flagKey)
                    .enabled(false)
                    .reason("FLAG_NOT_FOUND")
                    .build();
        }

        if (!flag.isEnabled()) {
            return buildResponse(flagKey, false, "DISABLED", null);
        }

        // Evaluate Rules
        for (TargetingRule rule : flag.getRules()) {
            if (ruleMatches(rule, attributes)) {
                return buildResponse(flagKey, rule.isRuleValue(), "RULE_MATCH", rule.getId().toString());
            }
        }

        // Rollout
        if (flag.getRolloutPercentage() > 0) {
            long hash = murmurHash3(flagKey + "." + userId);
            long bucket = (Math.abs(hash) % 100); // 0-99
            if (bucket < flag.getRolloutPercentage()) {
                return buildResponse(flagKey, true, "ROLLOUT", null);
            }
        }

        return buildResponse(flagKey, false, "DEFAULT_OFF", null);
    }

    private EvaluateDto.Response buildResponse(String key, boolean enabled, String reason, String ruleId) {
        return EvaluateDto.Response.builder()
                .flagKey(key)
                .enabled(enabled)
                .reason(reason)
                .ruleId(ruleId)
                .build();
    }

    private boolean ruleMatches(TargetingRule rule, Map<String, String> userAttributes) {
        if (userAttributes == null || !userAttributes.containsKey(rule.getAttribute())) {
            return false;
        }

        String userValue = userAttributes.get(rule.getAttribute());
        String ruleValue = rule.getValue();

        return switch (rule.getOperator()) {
            case "EQUALS" -> userValue.equals(ruleValue);
            case "NOT_EQUALS" -> !userValue.equals(ruleValue);
            case "CONTAINS" -> userValue.contains(ruleValue);
            case "EXACTLY_MATCHES" -> userValue.equalsIgnoreCase(ruleValue);
            case "STARTS_WITH" -> userValue.startsWith(ruleValue);
            case "ENDS_WITH" -> userValue.endsWith(ruleValue);
            case "IN" -> Arrays.stream(ruleValue.split(",")).map(String::trim).anyMatch(userValue::equals);
            case "NOT_IN" -> Arrays.stream(ruleValue.split(",")).map(String::trim).noneMatch(userValue::equals);
            default -> false;
        };
    }

    private long murmurHash3(String key) {
        byte[] data = key.getBytes();
        int offset = 0;
        int len = data.length;
        int seed = 0x9747b28c;
        
        long h1 = seed;
        int c1 = 0xcc9e2d51;
        int c2 = 0x1b873593;
        
        int end = offset + (len & ~3);
        for (int i = offset; i < end; i += 4) {
            int k1 = (data[i] & 0xFF) | ((data[i + 1] & 0xFF) << 8) | ((data[i + 2] & 0xFF) << 16) | ((data[i + 3] & 0xFF) << 24);
            k1 *= c1;
            k1 = Integer.rotateLeft(k1, 15);
            k1 *= c2;
            
            h1 ^= k1;
            h1 = Integer.rotateLeft((int) h1, 13);
            h1 = h1 * 5 + 0xe6546b64;
        }
        
        int k1 = 0;
        switch (len & 3) {
            case 3:
                k1 ^= (data[end + 2] & 0xFF) << 16;
            case 2:
                k1 ^= (data[end + 1] & 0xFF) << 8;
            case 1:
                k1 ^= (data[end] & 0xFF);
                k1 *= c1;
                k1 = Integer.rotateLeft(k1, 15);
                k1 *= c2;
                h1 ^= k1;
        }
        
        h1 ^= len;
        h1 ^= h1 >>> 16;
        h1 *= 0x85ebca6b;
        h1 ^= h1 >>> 13;
        h1 *= 0xc2b2ae35;
        h1 ^= h1 >>> 16;
        
        return h1 & 0xFFFFFFFFL; // treat as unsigned 32-bit
    }
}
