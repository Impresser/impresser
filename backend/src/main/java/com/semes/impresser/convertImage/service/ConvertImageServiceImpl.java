package com.semes.impresser.convertImage.service;

import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.common.response.PaginationResponse;
import com.semes.impresser.common.util.S3Util;
import com.semes.impresser.convertImage.dto.response.CompressionTypeResponse;
import com.semes.impresser.convertImage.dto.response.CompressionTypeVersionResponse;
import com.semes.impresser.convertImage.dto.response.ConvertHistoryDetailResponse;
import com.semes.impresser.convertImage.dto.response.ConvertHistoryItemResponse;
import com.semes.impresser.convertImage.entity.CompressionType;
import com.semes.impresser.convertImage.repository.CompressionTypeRepository;
import com.semes.impresser.convertImage.repository.ConvertHistoryRepository;
import com.semes.impresser.dashboard.dto.response.ConvertHistoryListResponse;
import com.semes.impresser.s3.service.FilePresignedService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConvertImageServiceImpl implements ConvertImageService {

    private final CompressionTypeRepository compressionTypeRepository;
    private final ConvertHistoryRepository convertHistoryRepository;
    private final FilePresignedService filePresignedService;

    @Override
    public List<CompressionTypeResponse> getCompressionTypes(String processingUnit) {
        String unit = normalizeProcessingUnit(processingUnit);

        List<CompressionType> list = compressionTypeRepository.findByProcessingUnitIgnoreCase(unit);

        return list.stream()
            .map(ct -> new CompressionTypeResponse(
                ct.getUuid(),
                ct.getCompressionType(),
                ct.getProcessingUnit().toLowerCase()
            ))
            .toList();
    }

    private String normalizeProcessingUnit(String raw) {
        if (raw == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        String v = raw.trim().toLowerCase();
        if (!("cpu".equals(v) || "gpu".equals(v))) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        return v;
    }

    @Override
    public List<CompressionTypeVersionResponse> getVersionsByCompressionTypeUuid(
        UUID compressionTypeUuid) {
        CompressionType base = compressionTypeRepository.findByUuid(compressionTypeUuid)
            .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));

        List<Integer> versions = compressionTypeRepository.findDistinctVersions(
            base.getCompressionType(),
            base.getProcessingUnit()
        );

        return versions.stream()
            .map(version -> new CompressionTypeVersionResponse(compressionTypeUuid,
                base.getCompressionType(), version))
            .toList();
    }

    @Override
    public PageResponse<ConvertHistoryItemResponse> getCompletedHistoryPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ConvertHistoryItemResponse> result = convertHistoryRepository.getCompletedHistories(
            pageable);

        List<ConvertHistoryItemResponse> items = result.getContent().stream()
            .map(it -> {
                String key = it.tiffUrl();
                String tiffName = S3Util.extractOriginalFileName(key);
                String url = key == null ? null : filePresignedService.getPresignedUrl(key);
                return ConvertHistoryItemResponse.toEntity(it, tiffName, url);
            })
            .toList();

        PaginationResponse pagination = new PaginationResponse(
            result.getNumber(),
            result.getSize(),
            result.getTotalPages(),
            result.getTotalElements(),
            result.isFirst(),
            result.isLast(),
            result.hasNext()
        );

        return new PageResponse<>(items, pagination);
    }

    @Override
    public ConvertHistoryDetailResponse getCompletedHistoryDetail(UUID convertHistoryUuid) {
        ConvertHistoryDetailResponse convertHistoryDetailResponse =
            convertHistoryRepository.getCompletedHistoryDetail(convertHistoryUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));

        return convertHistoryDetailResponse;
    }
}
