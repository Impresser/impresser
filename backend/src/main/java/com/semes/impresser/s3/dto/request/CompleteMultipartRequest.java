package com.semes.impresser.s3.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CompleteMultipartRequest(
    @NotBlank
    String objectName,

    @NotBlank
    String uploadId,

    @NotEmpty
    @Valid
    List<PartInfo> parts
) {

    public record PartInfo(
        int partNumber,

        @NotBlank
        String eTag
    ) {

    }
}
