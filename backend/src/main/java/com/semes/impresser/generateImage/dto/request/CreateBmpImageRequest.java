package com.semes.impresser.generateImage.dto.request;

import com.semes.impresser.generateImage.entity.GenerationHistory;
import com.semes.impresser.generateImage.entity.GenerationStatus;
import com.semes.impresser.user.entity.User;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CreateBmpImageRequest(

    @NotNull
    Long bmpWidth,

    @NotNull
    Long bmpHeight,

    @NotNull
    Long bmpVolume,

    @NotNull
    int redCountX,

    @NotNull
    int redCountY,

    @NotNull
    int redSizeX,

    @NotNull
    int redSizeY,

    @NotNull
    int redGapX,

    @NotNull
    int redGapY,

    @NotNull
    int greenCountX,

    @NotNull
    int greenCountY,

    @NotNull
    int greenSizeX,

    @NotNull
    int greenSizeY,

    @NotNull
    int greenGapX,

    @NotNull
    int greenGapY,

    @NotNull
    int blueCountX,

    @NotNull
    int blueCountY,

    @NotNull
    int blueSizeX,

    @NotNull
    int blueSizeY,

    @NotNull
    int blueGapX,

    @NotNull
    int blueGapY,

    @NotNull
    int rgGap,

    @NotNull
    int gbGap

) {

    public GenerationHistory toEntity(LocalDateTime requestedAt, User user) {
        return GenerationHistory.builder()
            .requestedAt(requestedAt)
            .bmpVolume(bmpVolume)
            .bmpWidth(bmpWidth)
            .bmpHeight(bmpHeight)
            .redCountX(redCountX)
            .redCountY(redCountY)
            .redSizeX(redSizeX)
            .redSizeY(redSizeY)
            .redGapX(redGapX)
            .redGapY(redGapY)
            .greenCountX(greenCountX)
            .greenCountY(greenCountY)
            .greenSizeX(greenSizeX)
            .greenSizeY(greenSizeY)
            .greenGapX(greenGapX)
            .greenGapY(greenGapY)
            .blueCountX(blueCountX)
            .blueCountY(blueCountY)
            .blueSizeX(blueSizeX)
            .blueSizeY(blueSizeY)
            .blueGapX(blueGapX)
            .blueGapY(blueGapY)
            .rgGap(rgGap)
            .gbGap(gbGap)
            .status(GenerationStatus.PENDING)
            .user(user)
            .build();
    }
}
