package com.semes.impresser.s3.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record InitBmpBatchRequest(
    @NotEmpty List<@NotBlank String> fileNames
) {

}
