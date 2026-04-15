package com.featureflags.repository;

import com.featureflags.model.entity.TargetingRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TargetingRuleRepository extends JpaRepository<TargetingRule, UUID> {
    Optional<TargetingRule> findByIdAndFlagId(UUID id, UUID flagId);
}
