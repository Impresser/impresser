package com.semes.impresser.s3.dto.response;

import lombok.Builder;

@Builder
public record PresignedUrlResponse(
    String uploadUrl,
    String fileUrl
) {

}
