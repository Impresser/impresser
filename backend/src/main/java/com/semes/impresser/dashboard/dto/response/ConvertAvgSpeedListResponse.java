package com.semes.impresser.dashboard.dto.response;

public record ConvertAvgSpeedListResponse(
    String compressionType,
    String processingUnit,
    Integer version,
    Double avgSpeed
) {

}
