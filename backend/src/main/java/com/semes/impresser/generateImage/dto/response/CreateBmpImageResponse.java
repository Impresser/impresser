package com.semes.impresser.generateImage.dto.response;

import com.semes.impresser.generateImage.entity.GenerationHistory;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;

@Builder
public record CreateBmpImageResponse(
    UUID generationUuid,
    LocalDateTime requestedAt
) {

    public static CreateBmpImageResponse toDto(GenerationHistory generationHistory) {
        return CreateBmpImageResponse.builder()
            .generationUuid(generationHistory.getUuid())
            .requestedAt(generationHistory.getRequestedAt())
            .build();
    }
}
