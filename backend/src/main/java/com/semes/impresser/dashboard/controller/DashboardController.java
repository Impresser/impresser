package com.semes.impresser.dashboard.controller;

import com.semes.impresser.common.response.BaseResponse;
import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.dashboard.dto.response.ConvertAvgSpeedListResponse;
import com.semes.impresser.dashboard.dto.response.ConvertHistoryDetailResponse;
import com.semes.impresser.dashboard.dto.response.ConvertHistoryListResponse;
import com.semes.impresser.dashboard.dto.response.InkjetDailyUsageCompareResponse;
import com.semes.impresser.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/convert/ranks")
    @Operation(summary = "알고리즘 순위 조회")
    public BaseResponse<PageResponse<ConvertAvgSpeedListResponse>> getConvertAvgSpeedList(
        @RequestParam(defaultValue = "0") @Min(0) Integer page,
        @RequestParam(defaultValue = "10") @Min(1) Integer size
    ) {
        PageResponse<ConvertAvgSpeedListResponse> pageResponse = dashboardService.getConvertAvgSpeedList(
            page, size);
        return BaseResponse.onSuccess(pageResponse);
    }

    @GetMapping("/convert/{compressionTypeUuid}")
    @Operation(summary = "알고리즘별 성능 순위 목록 조회")
    public BaseResponse<PageResponse<ConvertHistoryListResponse>> getConvertHistories(
        @PathVariable UUID compressionTypeUuid,
        @RequestParam(defaultValue = "0") @Min(0) Integer page,
        @RequestParam(defaultValue = "5") @Min(1) Integer size
    ) {
        PageResponse<ConvertHistoryListResponse> pageResponse =
            dashboardService.getConvertHistories(compressionTypeUuid, page, size);
        return BaseResponse.onSuccess(pageResponse);
    }

    @GetMapping("/convert/detail/{convertHistoryUuid}")
    @Operation(summary = "알고리즘 변환 성능 상세 조회")
    public BaseResponse<ConvertHistoryDetailResponse> getConvertHistoryDetail(
        @PathVariable UUID convertHistoryUuid
    ) {
        ConvertHistoryDetailResponse convertHistoryDetailResponse =
            dashboardService.getConvertHistoryDetail(convertHistoryUuid);
        return BaseResponse.onSuccess(convertHistoryDetailResponse);
    }

    @GetMapping("/inkjet/usage")
    @Operation(summary = "전체 설비 일일 평균 이용 시간 비교 (이번주 vs 지난주)")
    public BaseResponse<InkjetDailyUsageCompareResponse> getInkjetDailyUsageCompare() {
        InkjetDailyUsageCompareResponse response =
            dashboardService.getInkjetDailyUsageCompare();
        return BaseResponse.onSuccess(response);
    }
}
