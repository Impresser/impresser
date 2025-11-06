package com.semes.impresser.convertImage.dto.response;

import java.util.UUID;

public record CompressionTypeResponse(
    UUID compressionTypeUuid,
    String type,
    String processingUnit
) {

}
