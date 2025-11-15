package com.semes.impresser.dashboard.dto.response;

import java.sql.Date;

public record InkjetDailyUsageStatResponse(
    Date date,
    Double usageHours
) {

}
