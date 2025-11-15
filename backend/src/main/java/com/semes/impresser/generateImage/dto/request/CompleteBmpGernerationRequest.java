package com.semes.impresser.generateImage.dto.request;

import java.util.UUID;

public record CompleteBmpGernerationRequest(
    boolean isSuccess,
    String errorMessage,
    UUID generationUuid
) {

}
