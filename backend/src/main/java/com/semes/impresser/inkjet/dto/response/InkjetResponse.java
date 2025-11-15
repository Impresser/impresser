package com.semes.impresser.inkjet.dto.response;

import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;

@Builder
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
    String tiffName,
    String tiffUrl,
    Integer canvasX,
    Integer canvasY
) {

    public static InkjetResponse toDto(String tiffName, InkjetResponse inkjetResponse) {
        return InkjetResponse.builder()
            .inkjetUuid(inkjetResponse.inkjetUuid)
            .printerName(inkjetResponse.printerName)
            .modelName(inkjetResponse.modelName)
            .printerStatus(inkjetResponse.printerStatus)
            .processStatus(inkjetResponse.processStatus())
            .installDate(inkjetResponse.installDate)
            .cpu(inkjetResponse.cpu)
            .gpu(inkjetResponse.gpu)
            .ram(inkjetResponse.ram)
            .vram(inkjetResponse.vram)
            .sheetCount(inkjetResponse.sheetCount)
            .tiffName(tiffName)
            .tiffUrl(inkjetResponse.tiffUrl)
            .canvasX(inkjetResponse.canvasX)
            .canvasY(inkjetResponse.canvasY)
            .build();
    }
}
