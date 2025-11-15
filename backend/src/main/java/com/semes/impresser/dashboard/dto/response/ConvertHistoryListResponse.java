package com.semes.impresser.dashboard.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record ConvertHistoryListResponse(
    UUID convertHistoryUuid,
    String tiffUrl,
    String compressionType,
    String processingUnit,
    Integer version,
    Long tiffVolume,
    Long bmpVolume,
    String userName,
    BigDecimal avgSpeed,
    Long elapsedTime
) {

}
