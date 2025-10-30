package com.semes.impresser.auth.service;

import com.semes.impresser.auth.dto.request.LoginRequest;
import com.semes.impresser.auth.dto.response.LoginResponse;
import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.common.util.CookieUtil;
import com.semes.impresser.common.util.JwtUtil;
import com.semes.impresser.common.util.SecurityUtil;
import com.semes.impresser.user.entity.User;
import com.semes.impresser.user.entity.UserRole;
import com.semes.impresser.user.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final CookieUtil cookieUtil;
    private final StringRedisTemplate redisTemplate;

    @Value("${jwt.refresh-token-expiration-ms}")
    private int refreshTokenExpiration;

    @Override
    public LoginResponse login(LoginRequest loginRequest, HttpServletResponse response) {
        User user = userRepository.findByEmployeeNo(loginRequest.employeeNo())
            .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_SIGNIN));

        if (!encoder.matches(loginRequest.password(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_SIGNIN);
        }

        String accessToken = jwtUtil.generateToken(user.getUuid(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUuid(), user.getRole());

        // 쿠키에 refreshToken 저장
        cookieUtil.addHttpOnlyCookie(response, "refresh_token", refreshToken,
            refreshTokenExpiration);

        return new LoginResponse(accessToken, user.getUuid(), user.getEmployeeNo(),
            user.getUserName(), user.getRole(), user.getProfileKey());
    }

    @Override
    @Transactional
    public void logout(HttpServletRequest httpServletRequest,
        HttpServletResponse httpServletResponse) {
        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        UUID userUuid = currentUserUuid.get();

        String key = "refresh_token:" + userUuid;
        redisTemplate.delete(key);

        // 쿠키에서 refresh token 삭제
        cookieUtil.deleteCookie(httpServletResponse, "refresh_token");
    }

    @Override
    public String reissueToken(HttpServletRequest httpServletRequest) {
        String refreshToken = cookieUtil.getCookieValue(httpServletRequest, "refresh_token");

        if (refreshToken == null) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        try {
            jwtUtil.validateToken(refreshToken);

            String userUuid = jwtUtil.getSubject(refreshToken);
            String storedRefreshToken = redisTemplate.opsForValue()
                .get("refresh_token:" + userUuid);

            if (!refreshToken.equals(storedRefreshToken)) {
                throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
            }

            String roleClaim = jwtUtil.getRole(refreshToken);
            UserRole role = UserRole.valueOf(roleClaim);

            return jwtUtil.generateToken(UUID.fromString(userUuid), role);
        } catch (JwtException | IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
    }
}
