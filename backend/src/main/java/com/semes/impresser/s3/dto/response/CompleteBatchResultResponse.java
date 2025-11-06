package com.semes.impresser.s3.dto.response;

import java.util.List;
import java.util.Map;

public record CompleteBatchResultResponse(
    List<String> succeededUploadIds,
    Map<String, String> failed
) {

}
