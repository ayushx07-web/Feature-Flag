package com.featureflags.repository;

import com.featureflags.model.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByApiKey(String apiKey);
    
    // For this project scope, all authenticated users have access to all projects, 
    // but typically we would filter. Here we list all.
    List<Project> findAllByOrderByCreatedAtDesc();
    
    // Check if slug exists
    boolean existsBySlug(String slug);
}
