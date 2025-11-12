package com.semes.impresser.common.client.dto.request;

import com.semes.impresser.generateImage.entity.GenerationHistory;
import java.util.List;
import java.util.UUID;

public record GenerateImageApiRequest(
    List<String> partUploadUrls,
    String uploadId,
    String objectName,
    UUID generationUuid,
    Auth auth,
    Long bmpWidth,
    Long bmpHeight,
    Long bmpVolume,
    int redCountX,
    int redCountY,
    int redSizeX,
    int redSizeY,
    int redGapX,
    int redGapY,
    int greenCountX,
    int greenCountY,
    int greenSizeX,
    int greenSizeY,
    int greenGapX,
    int greenGapY,
    int blueCountX,
    int blueCountY,
    int blueSizeX,
    int blueSizeY,
    int blueGapX,
    int blueGapY,
    int rgGapX,
    int rgGapY,
    int gbGapX,
    int gbGapY
) {

    public record Auth(
        String scheme,
        String accessToken
    ) {

    }

    public static GenerateImageApiRequest from(
        List<String> partUploadUrls,
        String uploadId,
        String objectName,
        Auth auth,
        GenerationHistory history
    ) {
        return new GenerateImageApiRequest(
            partUploadUrls,
            uploadId,
            objectName,
            history.getUuid(),
            auth,
            history.getBmpWidth(),
            history.getBmpHeight(),
            history.getBmpVolume(),
            history.getRedCountX(),
            history.getRedCountY(),
            history.getRedSizeX(),
            history.getRedSizeY(),
            history.getRedGapX(),
            history.getRedGapY(),
            history.getGreenCountX(),
            history.getGreenCountY(),
            history.getGreenSizeX(),
            history.getGreenSizeY(),
            history.getGreenGapX(),
            history.getGreenGapY(),
            history.getBlueCountX(),
            history.getBlueCountY(),
            history.getBlueSizeX(),
            history.getBlueSizeY(),
            history.getBlueGapX(),
            history.getBlueGapY(),
            history.getRgGapX(),
            history.getRgGapY(),
            history.getGbGapX(),
            history.getGbGapY()
        );
    }
}
