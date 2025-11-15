package com.semes.impresser.inkjet.dto.response;

import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;

@Builder
public record AllInkjetResponse(
    UUID inkjetUuid,
    String printerName,
    String modelName,
    String printerStatus,
    String processStatus,
    LocalDate installDate,
    Integer canvasX,
    Integer canvasY
) {

}
