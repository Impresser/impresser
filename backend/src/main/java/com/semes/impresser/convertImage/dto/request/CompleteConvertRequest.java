package com.semes.impresser.convertImage.dto.request;

import java.math.BigDecimal;

public record CompleteConvertRequest(
    boolean isSuccess,
    String message,
    BigDecimal compressionTime,
    Long tiffVolume,
    Long tiffWidth,
    Long tiffHeight,
    Long avgGpuUtilization,
    BigDecimal avgSpeed,
    BigDecimal maxSpeed,
    BigDecimal minSpeed
) {

}
