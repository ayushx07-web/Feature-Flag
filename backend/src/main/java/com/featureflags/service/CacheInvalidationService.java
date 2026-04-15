package com.featureflags.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class CacheInvalidationService {

    private final RedisTemplate<String, Object> redisTemplate;

    public void invalidateFlagCache(String projectId, String flagKey) {
        String key = "flag:" + projectId + ":" + flagKey;
        redisTemplate.delete(key);
    }

    public void invalidateProjectFlagsCache(String projectId) {
        String pattern = "flag:" + projectId + ":*";
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
