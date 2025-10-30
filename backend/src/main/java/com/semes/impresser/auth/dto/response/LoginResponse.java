package com.semes.impresser.auth.dto.response;

import com.semes.impresser.user.entity.UserRole;
import java.util.UUID;

public record LoginResponse(
    String accessToken,
    UUID userUuid,
    String employeeNo,
    String userName,
    UserRole userRole,
    String profileUrl
) {

}
