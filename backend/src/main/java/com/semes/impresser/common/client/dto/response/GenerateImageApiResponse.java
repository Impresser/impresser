package com.semes.impresser.common.client.dto.response;

import java.util.UUID;

public record GenerateImageApiResponse(
    UUID generationUuid,
    String status
) {

}
