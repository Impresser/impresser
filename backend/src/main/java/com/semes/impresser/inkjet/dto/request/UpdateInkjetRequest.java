package com.semes.impresser.inkjet.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateInkjetRequest(
    @Size(max = 255)
    String modelName,

    @Size(max = 255)
    String printerName,

    @Size(max = 255)
    String cpu,

    @Size(max = 255)
    String gpu,

    @Size(max = 5)
    String ram,

    @Size(max = 5)
    String vram,

    String printerStatus,

    Integer canvasX,

    Integer canvasY
) {

}
