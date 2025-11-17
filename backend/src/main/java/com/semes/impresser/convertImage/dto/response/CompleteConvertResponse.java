package com.semes.impresser.convertImage.dto.response;

import com.semes.impresser.common.util.S3Util;
import com.semes.impresser.convertImage.entity.ConvertHistory;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.UUID;
import lombok.Builder;

@Builder
public record CompleteConvertResponse(
    UUID convertHistoryUuid,
    String tiffName,
    String processingUnit,
    String compressionType,
    Integer version,
    Long bmpVolume,
    Long tiffVolume,
    Long compressionRatio,
    String userName,
    String employeeNo,
    String completedAt,
    Long elapsedTime,
    BigDecimal compressionTim,
    String tiffUrl
) {

    public static CompleteConvertResponse fromEntity(ConvertHistory convertHistory) {
        return new CompleteConvertResponse(
            convertHistory.getUuid(),
            S3Util.extractOriginalFileName(convertHistory.getTiffKey()),
            convertHistory.getCompressionType().getProcessingUnit(),
            convertHistory.getCompressionType().getCompressionType(),
            convertHistory.getCompressionType().getVersion(),
            convertHistory.getBmpVolume(),
            convertHistory.getTiffVolume(),
            convertHistory.getCompressionRatio(),
            convertHistory.getUser().getUserName(),
            convertHistory.getUser().getEmployeeNo(),
            convertHistory.getCompletedAt().toString(),
            Duration.between(convertHistory.getRequestedAt(), convertHistory.getCompletedAt())
                .getSeconds(),
            convertHistory.getCompressionTime(),
            S3Util.buildUrlFromKey(convertHistory.getTiffKey())
        );
    }
}
