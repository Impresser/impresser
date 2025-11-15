package com.semes.impresser.convertImage.service;

import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.convertImage.dto.request.CompleteConvertRequest;
import com.semes.impresser.convertImage.dto.request.CreateConvertRequest;
import com.semes.impresser.convertImage.dto.response.CompressionTypeResponse;
import com.semes.impresser.convertImage.dto.response.CompressionTypeVersionResponse;
import com.semes.impresser.convertImage.dto.response.ConvertHistoryDetailResponse;
import com.semes.impresser.convertImage.dto.response.ConvertHistoryItemResponse;
import com.semes.impresser.convertImage.dto.response.CreateConvertResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

public interface ConvertImageService {

    List<CompressionTypeResponse> getCompressionTypes(String processingUnit);

    List<CompressionTypeVersionResponse> getVersionsByCompressionTypeUuid(UUID compressionTypeUuid);

    PageResponse<ConvertHistoryItemResponse> getCompletedHistoryPage(int page, int size);

    PageResponse<ConvertHistoryItemResponse> getMyCompletedHistoryPage(int page, int size);

    ConvertHistoryDetailResponse getCompletedHistoryDetail(UUID convertHistoryUuid);

    CreateConvertResponse createConvert(CreateConvertRequest creatConvertRequest);

    void completeConvert(UUID convertUuid, CompleteConvertRequest completeConvertRequest);
}
