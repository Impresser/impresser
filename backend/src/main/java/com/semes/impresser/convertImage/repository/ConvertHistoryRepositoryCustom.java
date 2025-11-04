package com.semes.impresser.convertImage.repository;

import com.semes.impresser.dashboard.dto.response.ConvertAvgSpeedListResponse;
import com.semes.impresser.dashboard.dto.response.ConvertHistoryListResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ConvertHistoryRepositoryCustom {

    Page<ConvertAvgSpeedListResponse> getConvertAvgSpeeds(Pageable pageable);

    Page<ConvertHistoryListResponse> getConvertHistories(UUID compressionTypeUuid,
        Pageable pageable);
}
