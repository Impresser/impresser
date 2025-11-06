package com.semes.impresser.s3.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CompleteBatchRequest(
    @NotEmpty List<@Valid CompleteMultipartRequest> items
) {

}
