package com.featureflags.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Allow Vite dev server
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://127.0.0.1:5173"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-API-Key"));
        config.setAllowCredentials(true);
        
        // Also apply CORS for public evaluation requests generically 
        // In a real prod this would typically be `*` for the Eval endpoints, 
        // but considering frontend needs credentials for auth endpoints, we keep explicit logic.
        
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
