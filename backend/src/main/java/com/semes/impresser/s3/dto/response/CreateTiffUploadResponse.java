package com.semes.impresser.s3.dto.response;

public record CreateTiffUploadResponse(
    String objectName,
    String fileName,
    String savedFileName,
    String uploadUrl,
    String imageUrl
) {

}
