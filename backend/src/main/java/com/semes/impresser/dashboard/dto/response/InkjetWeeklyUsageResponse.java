package com.semes.impresser.dashboard.dto.response;

import java.util.List;

public record InkjetWeeklyUsageResponse(
    String label,
    List<InkjetDailyUsageResponse> days
) {

}
