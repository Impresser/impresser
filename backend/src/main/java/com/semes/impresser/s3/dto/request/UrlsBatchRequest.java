package com.semes.impresser.s3.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record UrlsBatchRequest(
    @NotEmpty List<@Valid Job> jobs
) {

    public record Job(
        @NotBlank String objectName,
        @NotBlank String uploadId,
        @Min(1) int partCount
    ) {

    }
}
