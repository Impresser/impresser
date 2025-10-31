package com.semes.impresser.inkjet.dto.request;

import com.semes.impresser.inkjet.entity.InkjetPrinter;
import com.semes.impresser.inkjet.entity.PrinterStatus;
import com.semes.impresser.inkjet.entity.ProcessStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Builder;

@Builder
public record CreateInkjetRequest(
    @NotBlank
    @Size(max = 255)
    String modelName,

    @NotBlank
    @Size(max = 255)
    String printerName,

    @NotNull
    LocalDate installDate,

    @NotBlank
    @Size(max = 255)
    String cpu,

    @NotBlank
    @Size(max = 255)
    String gpu,

    @NotBlank
    @Size(max = 5)
    String ram,

    @NotBlank
    @Size(max = 5)
    String vram,

    @NotBlank
    String printerStatus,

    @NotBlank
    String processStatus,

    @NotNull
    Integer canvasX,

    @NotNull
    Integer canvasY
) {

    public InkjetPrinter toEntity(
        PrinterStatus printerStatus,
        ProcessStatus processStatus) {
        return InkjetPrinter.builder()
            .modelName(modelName)
            .printerName(printerName)
            .installDate(installDate)
            .cpu(cpu)
            .gpu(gpu)
            .printerStatus(printerStatus)
            .processStatus(processStatus)
            .ram(ram)
            .vram(vram)
            .canvasX(canvasX)
            .canvasY(canvasY)
            .build();
    }
}
