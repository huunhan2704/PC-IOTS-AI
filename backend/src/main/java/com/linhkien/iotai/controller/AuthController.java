package com.linhkien.iotai.controller;

import com.linhkien.iotai.dto.ApiResponse;
import com.linhkien.iotai.dto.auth.AuthDto;
import com.linhkien.iotai.entity.User;
import com.linhkien.iotai.entity.enums.Role;
import com.linhkien.iotai.exception.BadRequestException;
import com.linhkien.iotai.repository.UserRepository;
import com.linhkien.iotai.security.JwtTokenProvider;
import com.linhkien.iotai.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> authenticateUser(@Valid @RequestBody AuthDto.LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId()).orElseThrow();

        AuthDto.UserDto userDto = AuthDto.UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt().toString())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Đăng nhập thành công", AuthDto.AuthResponse.builder()
                .token(jwt)
                .user(userDto)
                .build()));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> registerUser(@Valid @RequestBody AuthDto.RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new BadRequestException("Tên đăng nhập '" + registerRequest.getUsername() + "' đã được sử dụng");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new BadRequestException("Email '" + registerRequest.getEmail() + "' đã được đăng ký");
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .passwordHash(passwordEncoder.encode(registerRequest.getPassword()))
                .fullName(registerRequest.getFullName())
                .email(registerRequest.getEmail())
                .phone(registerRequest.getPhone())
                .role(Role.ROLE_CUSTOMER)
                .build();

        User savedUser = userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        registerRequest.getUsername(),
                        registerRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        AuthDto.UserDto userDto = AuthDto.UserDto.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .phone(savedUser.getPhone())
                .role(savedUser.getRole().name())
                .createdAt(savedUser.getCreatedAt().toString())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Đăng ký tài khoản thành công", AuthDto.AuthResponse.builder()
                .token(jwt)
                .user(userDto)
                .build()));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthDto.UserDto>> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId()).orElseThrow();
        AuthDto.UserDto userDto = AuthDto.UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt().toString())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(userDto));
    }
}
