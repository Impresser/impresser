package com.semes.impresser.generateImage.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record AllGenerationHistoryResponse(
    UUID generationUuid,
    String bmpUrl,
    String userName,
    Long bmpHeight,
    Long bmpWidth,
    LocalDateTime requestedAt,
    LocalDateTime completedAt,
    boolean isGenerated
) {

}
