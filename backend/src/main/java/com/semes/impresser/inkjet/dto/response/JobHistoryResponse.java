package com.semes.impresser.inkjet.dto.response;

import com.semes.impresser.common.util.S3Util;
import com.semes.impresser.inkjet.entity.JobHistory;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;

@Builder
public record JobHistoryResponse(
    UUID jobUuid,
    String tiffImageUrl,
    LocalDateTime requestedAt,
    LocalDateTime completedAt,
    Long sheetCount
) {
    public static JobHistoryResponse toDto(JobHistory jobHistory) {
        return JobHistoryResponse.builder()
            .jobUuid(jobHistory.getUuid())
            .tiffImageUrl(S3Util.buildUrlFromKey(jobHistory.getImageKey()))
            .requestedAt(jobHistory.getRequestedAt())
            .completedAt(jobHistory.getCompletedAt())
            .sheetCount(jobHistory.getSheetCount())
            .build();
    }
}
