package com.semes.impresser.s3.dto.response;

public record UrlsBatchItemResponse(
    String objectName,
    String uploadId,
    PresignedUrlListResponse urls,
    String imageUrl
) {

}
