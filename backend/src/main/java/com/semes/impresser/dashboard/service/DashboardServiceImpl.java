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
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ConvertHistoryRepository convertHistoryRepository;

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
            ConvertHistoryDetailResponse.toDto(history,elapsedTime);

        return convertHistoryDetailResponse;
    }
}
