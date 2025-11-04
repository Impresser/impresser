package com.semes.impresser.generateImage.repository;

import com.semes.impresser.generateImage.dto.response.AllGenerationHistoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GenerationHistoryRepositoryCustom {

    Page<AllGenerationHistoryResponse> getAllGenerationHistories(Pageable pageable);
}
