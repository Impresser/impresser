package com.semes.impresser.dashboard.dto.response;

public record InkjetDailyUsageCompareResponse(
    InkjetWeeklyUsageResponse previousWeek,
    InkjetWeeklyUsageResponse currentWeek
) {

}
