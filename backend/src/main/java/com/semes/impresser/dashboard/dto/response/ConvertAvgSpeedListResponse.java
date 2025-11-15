package com.semes.impresser.dashboard.dto.response;

import java.util.UUID;

public record ConvertAvgSpeedListResponse(
    UUID compressionTypeUuid,
    String compressionType,
    String processingUnit,
    Integer version,
    Double avgSpeed
) {

}
