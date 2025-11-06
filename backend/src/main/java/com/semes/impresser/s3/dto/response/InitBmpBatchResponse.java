package com.semes.impresser.s3.dto.response;

import java.util.List;

public record InitBmpBatchResponse(
    List<InitMultipartUploadResponse> items
) {

}
