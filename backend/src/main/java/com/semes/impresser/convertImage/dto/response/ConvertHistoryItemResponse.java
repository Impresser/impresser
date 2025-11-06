package com.semes.impresser.convertImage.dto.response;

import java.util.UUID;
import lombok.Builder;

@Builder
public record ConvertHistoryItemResponse(
    UUID convertHistoryUuid,
    String tiffName,
    String processingUnit,
    String compressionType,
    Integer version,
    Long bmpVolume,
    Long tiffVolume,
    Long compressionRatio,
    String userName,
    String completedAt,
    Long elapsedTime,
    String tiffUrl
) {

    public static ConvertHistoryItemResponse toEntity(
        ConvertHistoryItemResponse src,
        String tiffName,
        String tiffUrl
    ) {
        return ConvertHistoryItemResponse.builder()
            .convertHistoryUuid(src.convertHistoryUuid())
            .tiffName(tiffName)
            .processingUnit(src.processingUnit())
            .compressionType(src.compressionType())
            .version(src.version())
            .bmpVolume(src.bmpVolume())
            .tiffVolume(src.tiffVolume())
            .compressionRatio(src.compressionRatio())
            .userName(src.userName())
            .completedAt(src.completedAt())
            .elapsedTime(src.elapsedTime())
            .tiffUrl(tiffUrl)
            .build();
    }
}
