package com.semes.impresser.dashboard.dto.response;

import com.semes.impresser.convertImage.entity.ConvertHistory;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record ConvertHistoryDetailResponse(
    Long avgGpuUtilization,
    Double avgSpeed,
    Double maxSpeed,
    Double minSpeed,
    LocalDateTime requestAt,
    LocalDateTime completedAt,
    String sourceExtension,
    String compressedExtension,
    BigDecimal compressionTime,
    Long elapsedTime
) {

    public static ConvertHistoryDetailResponse toDto(ConvertHistory history, Long elapsedTime) {
        return ConvertHistoryDetailResponse.builder()
            .avgGpuUtilization(history.getAvgGpuUtilization())
            .avgSpeed(history.getAvgSpeed() != null ? history.getAvgSpeed().doubleValue() : null)
            .maxSpeed(history.getMaxSpeed() != null ? history.getMaxSpeed().doubleValue() : null)
            .minSpeed(history.getMinSpeed() != null ? history.getMinSpeed().doubleValue() : null)
            .requestAt(history.getRequestedAt())
            .completedAt(history.getCompletedAt())
            .sourceExtension("BMP")
            .compressedExtension("TIFF")
            .compressionTime(history.getCompressionTime())
            .elapsedTime(elapsedTime)
            .build();
    }
}
