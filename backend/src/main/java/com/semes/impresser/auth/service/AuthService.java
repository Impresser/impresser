package com.semes.impresser.auth.service;

import com.semes.impresser.auth.dto.request.LoginRequest;
import com.semes.impresser.auth.dto.response.LoginResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {

    LoginResponse login(LoginRequest loginRequest, HttpServletResponse response);

    void logout(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse);

    String reissueToken(HttpServletRequest httpServletRequest);
}
