package com.semes.impresser.auth.controller;

import com.semes.impresser.auth.dto.request.LoginRequest;
import com.semes.impresser.auth.dto.response.LoginResponse;
import com.semes.impresser.auth.dto.response.ReissueTokenResponse;
import com.semes.impresser.auth.service.AuthService;
import com.semes.impresser.common.response.BaseResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public BaseResponse<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest,
        HttpServletResponse response) {
        LoginResponse loginResponse = authService.login(loginRequest, response);
        return BaseResponse.onSuccess(loginResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpServletRequest,
        HttpServletResponse httpServletResponse) {
        authService.logout(httpServletRequest, httpServletResponse);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reissue")
    public BaseResponse<ReissueTokenResponse> reissueToken(
        HttpServletRequest httpServletRequest) {
        String accessToken = authService.reissueToken(httpServletRequest);
        return BaseResponse.onSuccess(new ReissueTokenResponse(accessToken));
    }
}
