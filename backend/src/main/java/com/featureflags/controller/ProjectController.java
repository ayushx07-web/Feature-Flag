package com.featureflags.controller;

import com.featureflags.model.dto.ApiResponse;
import com.featureflags.model.dto.ProjectDto;
import com.featureflags.model.entity.Project;
import com.featureflags.model.entity.User;
import com.featureflags.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectDto.Response>>> getProjects() {
        List<ProjectDto.Response> responses = projectService.getAllProjects().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectDto.Response>> createProject(
            @Valid @RequestBody ProjectDto.Request request,
            @AuthenticationPrincipal User user) {
        Project project = projectService.createProject(request.getName(), request.getDescription(), user);
        return ResponseEntity.ok(ApiResponse.success(mapToDto(project)));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ApiResponse<ProjectDto.Response>> getProject(@PathVariable UUID projectId) {
        Project project = projectService.getProject(projectId);
        return ResponseEntity.ok(ApiResponse.success(mapToDto(project)));
    }
    
    @PostMapping("/{projectId}/rotate-key")
    public ResponseEntity<ApiResponse<ProjectDto.Response>> rotateKey(@PathVariable UUID projectId) {
        Project project = projectService.rotateApiKey(projectId);
        return ResponseEntity.ok(ApiResponse.success(mapToDto(project)));
    }

    private ProjectDto.Response mapToDto(Project p) {
        ProjectDto.Response res = new ProjectDto.Response();
        res.setId(p.getId().toString());
        res.setName(p.getName());
        res.setSlug(p.getSlug());
        res.setDescription(p.getDescription());
        res.setApiKey(p.getApiKey());
        res.setCreatedAt(p.getCreatedAt());
        res.setFlagsCount(0); // For list page typically we inject this count, skipping for brevity but can be enhanced
        return res;
    }
}
