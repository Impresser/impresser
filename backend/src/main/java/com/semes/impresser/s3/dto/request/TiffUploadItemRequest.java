package com.semes.impresser.s3.dto.request;

import jakarta.validation.constraints.NotBlank;

public record TiffUploadItemRequest(
    @NotBlank String fileName,
    String contentType
) {

    public String effectiveContentType() {
        return (contentType == null || contentType.isBlank()) ? "image/tiff" : contentType;
    }
}
