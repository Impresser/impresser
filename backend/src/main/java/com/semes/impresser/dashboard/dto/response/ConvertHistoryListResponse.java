package com.semes.impresser.dashboard.dto.response;

import java.math.BigDecimal;

public record ConvertHistoryListResponse(
    String tiffUrl,
    String compressionType,
    String processingUnit,
    Integer version,
    Long tiffVolume,
    String userName,
    BigDecimal avgSpeed,
    Long elapsedTime
) {

}
