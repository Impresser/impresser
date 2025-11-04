package com.semes.impresser.generateImage.dto.response;

import com.semes.impresser.generateImage.entity.GenerationHistory;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;

@Builder
public record GenerationHistoryResponse(
    UUID generationUuid,
    String bmpUrl,
    LocalDateTime requestedAt,
    LocalDateTime completedAt,
    Long bmpWidth,
    Long bmpHeight,
    Long bmpVolume,
    boolean isGenerated,
    int redCountX,
    int redCountY,
    int redSizeX,
    int redSizeY,
    int redGapX,
    int redGapY,
    int greenCountX,
    int greenCountY,
    int greenSizeX,
    int greenSizeY,
    int greenGapX,
    int greenGapY,
    int blueCountX,
    int blueCountY,
    int blueSizeX,
    int blueSizeY,
    int blueGapX,
    int blueGapY,
    int rgGap,
    int gbGap
) {

    public static GenerationHistoryResponse toDto(
        GenerationHistory generationHistory, boolean isGenerated) {
        return GenerationHistoryResponse.builder()
            .generationUuid(generationHistory.getUuid())
            .bmpUrl(generationHistory.getBmpKey())
            .requestedAt(generationHistory.getRequestedAt())
            .completedAt(generationHistory.getCompletedAt())
            .bmpWidth(generationHistory.getBmpWidth())
            .bmpHeight(generationHistory.getBmpHeight())
            .bmpVolume(generationHistory.getBmpVolume())
            .isGenerated(isGenerated)
            .redCountX(generationHistory.getRedCountX())
            .redCountY(generationHistory.getRedCountY())
            .redSizeX(generationHistory.getRedSizeX())
            .redSizeY(generationHistory.getRedSizeY())
            .redGapX(generationHistory.getRedGapX())
            .redGapY(generationHistory.getRedGapY())
            .greenCountX(generationHistory.getGreenCountX())
            .greenCountY(generationHistory.getGreenCountY())
            .greenSizeX(generationHistory.getGreenSizeX())
            .greenSizeY(generationHistory.getGreenSizeY())
            .greenGapX(generationHistory.getGreenGapX())
            .greenGapY(generationHistory.getGreenGapY())
            .blueCountX(generationHistory.getBlueCountX())
            .blueCountY(generationHistory.getBlueCountY())
            .blueSizeX(generationHistory.getBlueSizeX())
            .blueSizeY(generationHistory.getBlueSizeY())
            .blueGapX(generationHistory.getBlueGapX())
            .blueGapY(generationHistory.getBlueGapY())
            .rgGap(generationHistory.getRgGap())
            .gbGap(generationHistory.getGbGap())
            .build();
    }
}
