package com.semes.impresser.common.client.dto.request;

import java.util.UUID;

public record ConvertImageRequest(
    String inputUrl,
    String outputUrl,
    String compressionType,
    String processingUnit,
    Integer rowsPerStrip,
    UUID convertUuid,
    Auth auth
) {
    public record Auth(
        String scheme,
        String accessToken
    ) {

    }
}
