package com.semes.impresser.s3.dto.response;

public record UrlsBatchItem(
    String objectName,
    String uploadId,
    PresignedUrlListResponse urls
) {

}
