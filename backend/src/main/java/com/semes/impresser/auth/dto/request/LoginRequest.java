package com.semes.impresser.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
    @NotBlank
    @Size(min = 7, max = 7)
    String employeeNo,

    @NotBlank
    @Size(min = 9, max = 16)
    String password
) {

}
