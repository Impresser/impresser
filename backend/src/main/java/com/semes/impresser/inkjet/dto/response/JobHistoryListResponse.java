package com.semes.impresser.inkjet.dto.response;

import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.inkjet.entity.InkjetPrinter;
import java.util.UUID;
import lombok.Builder;

@Builder
public record JobHistoryListResponse(
    UUID inkjetUuid,
    String printerName,
    String modelName,
    PageResponse<JobHistoryResponse> content
) {

    public static JobHistoryListResponse toDto(InkjetPrinter inkjetPrinter,
        PageResponse<JobHistoryResponse> content) {
        return JobHistoryListResponse.builder()
            .inkjetUuid(inkjetPrinter.getUuid())
            .printerName(inkjetPrinter.getPrinterName())
            .modelName(inkjetPrinter.getModelName())
            .content(content)
            .build();
    }
}
