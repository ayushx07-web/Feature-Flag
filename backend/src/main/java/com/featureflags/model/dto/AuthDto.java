package com.featureflags.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class AuthDto {

    @Data
    public static class LoginRequest {
        @Email
        @NotBlank
        private String email;

        @NotBlank
        private String password;
    }

    @Data
    public static class RegisterRequest {
        @Email
        @NotBlank
        private String email;

        @NotBlank
        private String password;

        @NotBlank
        private String fullName;
    }

    @Data
    public static class RefreshRequest {
        @NotBlank
        private String refreshToken;
    }

    @Data
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private UserResponse user;
    }

    @Data
    public static class UserResponse {
        private String id;
        private String email;
        private String fullName;
        private String role;
    }
}
