package com.semes.impresser.inkjet.dto.response;

import java.time.LocalDate;
import java.util.UUID;

public record AllInkjetResponse(
    UUID inkjetUuid,
    String printerName,
    String modelName,
    String printerStatus,
    String processStatus,
    LocalDate installDate
) {

}
