package com.semes.impresser.convertImage.dto.response;

import java.math.BigDecimal;

public record ConvertHistoryDetailResponse(
    Long avgGpuUtilization,
    BigDecimal avgSpeed,
    BigDecimal maxSpeed,
    BigDecimal minSpeed,
    String requestedAt,
    String completedAt,
    Long elapsedTime,
    String sourceExtension,
    String compressedExtension,
    Long compressionTime
) {

}
