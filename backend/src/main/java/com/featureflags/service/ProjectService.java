package com.featureflags.service;

import com.featureflags.model.entity.Project;
import com.featureflags.model.entity.User;
import com.featureflags.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final CacheInvalidationService cacheInvalidationService;

    public List<Project> getAllProjects() {
        return projectRepository.findAllByOrderByCreatedAtDesc();
    }

    public Project createProject(String name, String description, User user) {
        String slug = name.toLowerCase().replaceAll("[^a-z0-9]", "-");
        if (projectRepository.existsBySlug(slug)) {
            slug = slug + "-" + UUID.randomUUID().toString().substring(0, 5);
        }

        Project project = Project.builder()
                .name(name)
                .slug(slug)
                .description(description)
                .apiKey("ff_live_" + UUID.randomUUID().toString())
                .createdBy(user)
                .build();

        return projectRepository.save(project);
    }

    public Project getProject(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
    }

    @CacheEvict(value = "projectApiKeys", key = "#result.apiKey")
    public Project rotateApiKey(UUID id) {
        Project project = getProject(id);
        String oldKey = project.getApiKey();
        
        project.setApiKey("ff_live_" + UUID.randomUUID().toString());
        Project saved = projectRepository.save(project);

        // Also invalidate all flags cached for this project because SDK needs fresh state mapping to new cache namespace? 
        // Or wait, wildcard delete isn't on apiKey, it's on projectId. Let's do it on projectId.
        cacheInvalidationService.invalidateProjectFlagsCache(id.toString());

        return saved;
    }
}
