package com.semes.impresser.convertImage.repository;

import com.semes.impresser.convertImage.dto.response.ConvertHistoryDetailResponse;
import com.semes.impresser.convertImage.dto.response.ConvertHistoryItemResponse;
import com.semes.impresser.dashboard.dto.response.ConvertAvgSpeedListResponse;
import com.semes.impresser.dashboard.dto.response.ConvertHistoryListResponse;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ConvertHistoryRepositoryCustom {

    Page<ConvertAvgSpeedListResponse> getConvertAvgSpeeds(Pageable pageable);

    Page<ConvertHistoryListResponse> getConvertHistories(UUID compressionTypeUuid,
        Pageable pageable);

    Page<ConvertHistoryItemResponse> getCompletedHistories(Pageable pageable);

    Optional<ConvertHistoryDetailResponse> getCompletedHistoryDetail(UUID convertHistoryUuid);
}
