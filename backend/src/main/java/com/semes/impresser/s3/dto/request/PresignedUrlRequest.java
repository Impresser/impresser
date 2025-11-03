package com.semes.impresser.s3.dto.request;

import jakarta.validation.constraints.NotBlank;

public record PresignedUrlRequest(
    @NotBlank
    String fileName
) {

}
