package com.semes.impresser.dashboard.dto.response;

public record InkjetDailyUsageResponse(
    String dayOfWeek,
    Double usageHours
) {

}
