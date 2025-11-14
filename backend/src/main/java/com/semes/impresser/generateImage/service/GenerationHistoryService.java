package com.semes.impresser.generateImage.service;

import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.generateImage.dto.request.CompleteBmpGernerationRequest;
import com.semes.impresser.generateImage.dto.request.CreateBmpImageRequest;
import com.semes.impresser.generateImage.dto.response.AllGenerationHistoryResponse;
import com.semes.impresser.generateImage.dto.response.CreateBmpImageResponse;
import com.semes.impresser.generateImage.dto.response.GenerationHistoryResponse;
import java.util.UUID;

public interface GenerationHistoryService {

    CreateBmpImageResponse createBmpImage(
        CreateBmpImageRequest createBmpImageRequest);

    GenerationHistoryResponse getGenerationHistory(UUID generationUuid);

    PageResponse<AllGenerationHistoryResponse> getAllGenerationHistories(Integer page, Integer size);

    PageResponse<AllGenerationHistoryResponse> getMyGenerationHistories(Integer page, Integer size);

    void processGenerationCompletion(UUID generationUuid, CompleteBmpGernerationRequest completeBmpGernerationRequest);
}
