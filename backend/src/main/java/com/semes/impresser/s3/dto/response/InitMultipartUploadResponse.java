package com.semes.impresser.s3.dto.response;

public record InitMultipartUploadResponse(
    String uploadId,
    String objectName,
    String fileName,
    String savedFileName
) {

}
