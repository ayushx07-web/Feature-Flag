package com.featureflags.repository;

import com.featureflags.model.entity.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, UUID> {
    List<FeatureFlag> findByProjectId(UUID projectId);
    Optional<FeatureFlag> findByIdAndProjectId(UUID id, UUID projectId);
    Optional<FeatureFlag> findByKeyAndProjectId(String key, UUID projectId);
}
