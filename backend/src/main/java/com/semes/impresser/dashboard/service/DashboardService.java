package com.semes.impresser.dashboard.service;

import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.dashboard.dto.response.ConvertAvgSpeedListResponse;
import com.semes.impresser.dashboard.dto.response.ConvertHistoryDetailResponse;
import com.semes.impresser.dashboard.dto.response.ConvertHistoryListResponse;
import java.util.UUID;

public interface DashboardService {

    PageResponse<ConvertAvgSpeedListResponse> getConvertAvgSpeedList(Integer page, Integer size);

    PageResponse<ConvertHistoryListResponse> getConvertHistories(
        UUID compressionTypeUuid, Integer page, Integer size);

    ConvertHistoryDetailResponse getConvertHistoryDetail(UUID convertHistoryUuid);
}
