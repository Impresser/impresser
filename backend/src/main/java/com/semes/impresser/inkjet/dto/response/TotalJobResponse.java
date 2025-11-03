package com.semes.impresser.inkjet.dto.response;

import java.time.LocalDate;
import lombok.Builder;

@Builder
public record TotalJobResponse(
    Long totalSheetCount,
    LocalDate completedDate
) {

}
