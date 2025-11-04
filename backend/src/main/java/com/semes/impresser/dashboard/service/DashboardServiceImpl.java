package com.semes.impresser.dashboard.service;

import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.common.response.PaginationResponse;
import com.semes.impresser.common.util.SecurityUtil;
import com.semes.impresser.convertImage.entity.ConvertHistory;
import com.semes.impresser.convertImage.repository.ConvertHistoryRepository;
import com.semes.impresser.dashboard.dto.response.ConvertAvgSpeedListResponse;
import com.semes.impresser.dashboard.dto.response.ConvertHistoryDetailResponse;
import com.semes.impresser.dashboard.dto.response.ConvertHistoryListResponse;
import com.semes.impresser.dashboard.dto.response.InkjetDailyUsageCompareResponse;
import com.semes.impresser.dashboard.dto.response.InkjetDailyUsageResponse;
import com.semes.impresser.dashboard.dto.response.InkjetDailyUsageStatResponse;
import com.semes.impresser.dashboard.dto.response.InkjetWeeklyUsageResponse;
import com.semes.impresser.inkjet.repository.InkjetRepository;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ConvertHistoryRepository convertHistoryRepository;
    private final InkjetRepository inkjetRepository;

    @Override
    public PageResponse<ConvertAvgSpeedListResponse> getConvertAvgSpeedList(Integer page,
        Integer size) {

        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();
        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Pageable pageable = PageRequest.of(page, size);

        Page<ConvertAvgSpeedListResponse> result =
            convertHistoryRepository.getConvertAvgSpeeds(pageable);

        List<ConvertAvgSpeedListResponse> content = result.getContent();

        PaginationResponse pagination = new PaginationResponse(
            page,
            size,
            result.getTotalPages(),
            result.getTotalElements(),
            page == 0,
            page == result.getTotalPages() - 1,
            page < result.getTotalPages() - 1
        );

        PageResponse<ConvertAvgSpeedListResponse> pageResponse =
            new PageResponse<>(content, pagination);

        return pageResponse;
    }

    @Override
    public PageResponse<ConvertHistoryListResponse> getConvertHistories(
        UUID compressionTypeUuid, Integer page, Integer size) {

        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();
        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Pageable pageable = PageRequest.of(page, size);

        Page<ConvertHistoryListResponse> result =
            convertHistoryRepository.getConvertHistories(compressionTypeUuid, pageable);

        List<ConvertHistoryListResponse> content = result.getContent();

        PaginationResponse pagination = new PaginationResponse(
            page,
            size,
            result.getTotalPages(),
            result.getTotalElements(),
            page == 0,
            page == result.getTotalPages() - 1,
            page < result.getTotalPages() - 1
        );

        PageResponse<ConvertHistoryListResponse> pageResponse =
            new PageResponse<>(content, pagination);

        return pageResponse;
    }

    @Override
    public ConvertHistoryDetailResponse getConvertHistoryDetail(UUID convertHistoryUuid) {

        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();
        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        ConvertHistory history = convertHistoryRepository.findByUuid(convertHistoryUuid)
            .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));

        LocalDateTime requestAt = history.getRequestedAt();
        LocalDateTime completedAt = history.getCompletedAt();

        Long elapsedTime = null;
        if (requestAt != null && completedAt != null) {
            elapsedTime = Duration.between(requestAt, completedAt).getSeconds();
        }

        ConvertHistoryDetailResponse convertHistoryDetailResponse =
            ConvertHistoryDetailResponse.toDto(history, elapsedTime);

        return convertHistoryDetailResponse;
    }

    @Override
    public InkjetDailyUsageCompareResponse getInkjetDailyUsageCompare() {

        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();
        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        LocalDate today = LocalDate.now();

        LocalDate currentMonday = today.with(DayOfWeek.MONDAY);
        LocalDate currentSunday = currentMonday.plusDays(6);

        LocalDate previousMonday = currentMonday.minusWeeks(1);
        LocalDate previousSunday = currentMonday.minusDays(1);

        List<InkjetDailyUsageStatResponse> currentStats =
            inkjetRepository.getDailyAvgUsage(currentMonday, currentSunday);

        List<InkjetDailyUsageStatResponse> previousStats =
            inkjetRepository.getDailyAvgUsage(previousMonday, previousSunday);

        Map<LocalDate, Double> currentMap = currentStats.stream()
            .collect(Collectors.toMap(
                stat -> stat.date().toLocalDate(),
                InkjetDailyUsageStatResponse::usageHours
            ));

        Map<LocalDate, Double> previousMap = previousStats.stream()
            .collect(Collectors.toMap(
                stat -> stat.date().toLocalDate(),
                InkjetDailyUsageStatResponse::usageHours
            ));

        List<InkjetDailyUsageResponse> currentDays = new ArrayList<>();
        List<InkjetDailyUsageResponse> previousDays = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            LocalDate curDate = currentMonday.plusDays(i);
            LocalDate prevDate = previousMonday.plusDays(i);

            Double curHours = currentMap.getOrDefault(curDate, 0.0);
            Double prevHours = previousMap.getOrDefault(prevDate, 0.0);

            String dayLabel = curDate.getDayOfWeek().name().substring(0, 3);

            currentDays.add(new InkjetDailyUsageResponse(dayLabel, curHours));
            previousDays.add(new InkjetDailyUsageResponse(dayLabel, prevHours));
        }

        InkjetWeeklyUsageResponse currentWeek = new InkjetWeeklyUsageResponse(
            currentMonday + " ~ " + currentSunday,
            currentDays
        );

        InkjetWeeklyUsageResponse previousWeek = new InkjetWeeklyUsageResponse(
            previousMonday + " ~ " + previousSunday,
            previousDays
        );

        InkjetDailyUsageCompareResponse inkjetDailyUsageCompareResponse =
            new InkjetDailyUsageCompareResponse(previousWeek, currentWeek);

        return inkjetDailyUsageCompareResponse;
    }
}
