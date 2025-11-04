package com.semes.impresser.generateImage.dto.response;

import com.semes.impresser.generateImage.entity.GenerationHistory;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record CreateBmpImageAsyncResponse(
    String bmpKey,
    Long bmpWidth,
    Long bmpHeight,
    LocalDateTime requestedAt,
    LocalDateTime completedAt,
    String status,
    String errorMessage
) {

    public static CreateBmpImageAsyncResponse success(
        GenerationHistory generationHistory, String bmpKey) {
        return CreateBmpImageAsyncResponse.builder()
            .bmpKey(bmpKey)
            .bmpWidth(generationHistory.getBmpWidth())
            .bmpHeight(generationHistory.getBmpHeight())
            .requestedAt(generationHistory.getRequestedAt())
            .completedAt(generationHistory.getCompletedAt())
            .status("Success")
            .build();
    }

    public static CreateBmpImageAsyncResponse failure(
        GenerationHistory generationHistory, String errorMessage) {
        return CreateBmpImageAsyncResponse.builder()
            .bmpKey(null)
            .bmpWidth(generationHistory.getBmpWidth())
            .bmpHeight(generationHistory.getBmpHeight())
            .requestedAt(generationHistory.getRequestedAt())
            .completedAt(generationHistory.getCompletedAt())
            .status("Failure")
            .errorMessage(errorMessage)
            .build();
    }
}
