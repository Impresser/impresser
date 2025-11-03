package com.semes.impresser.inkjet.dto.request;

import com.semes.impresser.inkjet.entity.InkjetPrinter;
import com.semes.impresser.inkjet.entity.JobHistory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CreateJobHistoryRequest(
    @NotBlank
    String tiffUrl,

    @NotNull
    Long sheetCount
) {

    public JobHistory toEntity(LocalDateTime requestedAt, InkjetPrinter inkjetPrinter) {
        return JobHistory.builder()
            .imageKey(tiffUrl)
            .sheetCount(sheetCount)
            .requestedAt(requestedAt)
            .printer(inkjetPrinter)
            .build();
    }
}
