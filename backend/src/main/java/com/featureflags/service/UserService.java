package com.featureflags.service;

import com.featureflags.model.entity.User;
import com.featureflags.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User registerUser(String email, String rawPassword, String fullName) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already taken");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .fullName(fullName)
                .role("MEMBER")
                .build();

        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
