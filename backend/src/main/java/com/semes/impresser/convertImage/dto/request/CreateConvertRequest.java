package com.semes.impresser.convertImage.dto.request;

import com.semes.impresser.convertImage.entity.CompressionType;
import com.semes.impresser.convertImage.entity.ConvertHistory;
import com.semes.impresser.user.entity.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.UUID;

public record CreateConvertRequest(
    @NotBlank
    @Size(max = 200)
    String bmpUrl,

    @NotNull
    UUID compressionTypeUuid,

    Long bmpVolume,
    Long bmpWidth,
    Long bmpHeight
) {

    public ConvertHistory toEntity(String bmpKey, String tiffKey, LocalDateTime requestedAt,
        CompressionType compressionType, User user) {
        return ConvertHistory.builder()
            .bmpKey(bmpKey)
            .bmpVolume(bmpVolume)
            .bmpWidth(bmpWidth)
            .bmpHeight(bmpHeight)
            .tiffKey(tiffKey)
            .tiffWidth(bmpWidth)
            .tiffHeight(bmpHeight)
            .requestedAt(requestedAt)
            .compressionType(compressionType)
            .user(user)
            .build();
    }
}
