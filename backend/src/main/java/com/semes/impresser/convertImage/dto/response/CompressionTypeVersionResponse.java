package com.semes.impresser.convertImage.dto.response;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CompressionTypeVersionResponse(
    @NotBlank UUID compressionTypeUuid,
    String compressionType,
    Integer version
) {

}
