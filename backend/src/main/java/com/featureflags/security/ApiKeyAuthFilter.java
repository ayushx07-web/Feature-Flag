package com.featureflags.security;

import com.featureflags.model.entity.Project;
import com.featureflags.repository.ProjectRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.cache.Cache;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final ProjectRepository projectRepository;
    private final CacheManager cacheManager;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Only process evaluation and sdk endpoints
        String path = request.getRequestURI();
        if (path.startsWith("/api/v1/evaluate") || path.startsWith("/api/v1/sdk")) {
            String apiKey = request.getHeader("X-API-Key");
            if (apiKey != null) {
                Project project = resolveProject(apiKey);
                if (project != null) {
                    // Authenticated via API key, set project in context using its own specific token
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(project, null, Collections.emptyList());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid API Key");
                    return;
                }
            } else {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "API Key missing in X-API-Key header");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }

    private Project resolveProject(String apiKey) {
        Cache cache = cacheManager.getCache("projectApiKeys");
        if (cache != null) {
            Project cachedProject = cache.get(apiKey, Project.class);
            if (cachedProject != null) return cachedProject;
        }

        return projectRepository.findByApiKey(apiKey).map(p -> {
            if (cache != null) {
                cache.put(apiKey, p);
            }
            return p;
        }).orElse(null);
    }
}
