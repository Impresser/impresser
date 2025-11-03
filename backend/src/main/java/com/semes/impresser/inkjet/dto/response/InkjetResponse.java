package com.semes.impresser.inkjet.dto.response;

import java.time.LocalDate;
import java.util.UUID;

public record InkjetResponse(
    UUID inkjetUuid,
    String printerName,
    String modelName,
    String printerStatus,
    String processStatus,
    LocalDate installDate,
    String cpu,
    String gpu,
    String ram,
    String vram,
    Long sheetCount,
    String tiffName // todo : tiffKey -> tiffName
) {

}
