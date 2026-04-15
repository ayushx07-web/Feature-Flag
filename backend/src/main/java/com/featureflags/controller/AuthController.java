package com.featureflags.controller;

import com.featureflags.model.dto.ApiResponse;
import com.featureflags.model.dto.AuthDto;
import com.featureflags.model.entity.User;
import com.featureflags.security.JwtUtil;
import com.featureflags.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, Object> redisTemplate; // for blacklisting tokens

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        User user = userService.registerUser(request.getEmail(), request.getPassword(), request.getFullName());
        
        String accessToken = jwtUtil.generateAccessToken(user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return ResponseEntity.ok(ApiResponse.success(buildAuthResponse(user, accessToken, refreshToken)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userService.findByEmail(request.getEmail()).orElseThrow();

        String accessToken = jwtUtil.generateAccessToken(user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return ResponseEntity.ok(ApiResponse.success(buildAuthResponse(user, accessToken, refreshToken)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> refresh(@Valid @RequestBody AuthDto.RefreshRequest request) {
        String token = request.getRefreshToken();
        
        Boolean blacklisted = redisTemplate.hasKey("blacklist:" + token);
        if (Boolean.TRUE.equals(blacklisted) || !jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).body(ApiResponse.error("INVALID_TOKEN", "Refresh token is invalid or expired"));
        }

        String email = jwtUtil.extractEmail(token);
        User user = userService.findByEmail(email).orElseThrow();

        String accessToken = jwtUtil.generateAccessToken(user.getEmail());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        
        // Blacklist old refresh token
        redisTemplate.opsForValue().set("blacklist:" + token, true, 7, TimeUnit.DAYS);

        return ResponseEntity.ok(ApiResponse.success(buildAuthResponse(user, accessToken, newRefreshToken)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody AuthDto.RefreshRequest request) {
        String token = request.getRefreshToken();
        if (jwtUtil.validateToken(token)) {
            redisTemplate.opsForValue().set("blacklist:" + token, true, 7, TimeUnit.DAYS);
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private AuthDto.AuthResponse buildAuthResponse(User user, String access, String refresh) {
        AuthDto.UserResponse u = new AuthDto.UserResponse();
        u.setId(user.getId().toString());
        u.setEmail(user.getEmail());
        u.setFullName(user.getFullName());
        u.setRole(user.getRole());

        AuthDto.AuthResponse res = new AuthDto.AuthResponse();
        res.setAccessToken(access);
        res.setRefreshToken(refresh);
        res.setUser(u);
        return res;
    }
}
