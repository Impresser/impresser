package com.semes.impresser.generateImage.dto.response;

import com.semes.impresser.s3.service.FilePresignedService;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;

@Builder
public record AllGenerationHistoryResponse(
    UUID generationUuid,
    String bmpUrl,
    String userName,
    String employeeNo,
    Long bmpHeight,
    Long bmpWidth,
    Long bmpVolume,
    LocalDateTime requestedAt,
    LocalDateTime completedAt,
    boolean isGenerated
) {
    public static AllGenerationHistoryResponse from(
        AllGenerationHistoryResponse item,
        FilePresignedService filePresignedService
    ) {
        return AllGenerationHistoryResponse.builder()
            .generationUuid(item.generationUuid())
            .bmpUrl(filePresignedService.getDownloadPresignedUrl(item.bmpUrl()))
            .userName(item.userName())
            .employeeNo(item.employeeNo())
            .bmpHeight(item.bmpHeight())
            .bmpWidth(item.bmpWidth())
            .bmpVolume(item.bmpVolume())
            .requestedAt(item.requestedAt())
            .completedAt(item.completedAt())
            .isGenerated(item.isGenerated())
            .build();
    }
}
