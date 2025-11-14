package com.semes.impresser.convertImage.service;

import com.semes.impresser.common.client.ExternalApiClient;
import com.semes.impresser.common.client.dto.request.ConvertImageRequest;
import com.semes.impresser.common.client.dto.request.ConvertImageRequest.Auth;
import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.common.response.PaginationResponse;
import com.semes.impresser.common.service.SseService;
import com.semes.impresser.common.util.S3Util;
import com.semes.impresser.common.util.SecurityUtil;
import com.semes.impresser.convertImage.dto.request.CompleteConvertRequest;
import com.semes.impresser.convertImage.dto.request.CreateConvertRequest;
import com.semes.impresser.convertImage.dto.response.CompressionTypeResponse;
import com.semes.impresser.convertImage.dto.response.CompressionTypeVersionResponse;
import com.semes.impresser.convertImage.dto.response.ConvertHistoryDetailResponse;
import com.semes.impresser.convertImage.dto.response.ConvertHistoryItemResponse;
import com.semes.impresser.convertImage.dto.response.CreateConvertResponse;
import com.semes.impresser.convertImage.entity.CompressionType;
import com.semes.impresser.convertImage.entity.ConvertHistory;
import com.semes.impresser.convertImage.repository.CompressionTypeRepository;
import com.semes.impresser.convertImage.repository.ConvertHistoryRepository;
import com.semes.impresser.s3.dto.response.CreateTiffUploadResponse;
import com.semes.impresser.s3.service.FilePresignedService;
import com.semes.impresser.user.entity.User;
import com.semes.impresser.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConvertImageServiceImpl implements ConvertImageService {

    private static final String SSE_EVENT_SUCCESS = "CONVERT_BMP_SUCCESS";
    private static final String SSE_EVENT_FAILED = "CONVERT_BMP_FAILED";
    private final CompressionTypeRepository compressionTypeRepository;
    private final ConvertHistoryRepository convertHistoryRepository;
    private final FilePresignedService filePresignedService;
    private final UserRepository userRepository;
    private final ExternalApiClient externalApiClient;
    private final SseService sseService;

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
    public PageResponse<ConvertHistoryItemResponse> getMyCompletedHistoryPage(int page, int size) {
        UUID userUuid = SecurityUtil.getCurrentUserUuid()
            .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TOKEN));

        Pageable pageable = PageRequest.of(page, size);

        Page<ConvertHistoryItemResponse> result =
            convertHistoryRepository.getMyCompletedHistories(userUuid, pageable);

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

    @Override
    @Transactional
    public CreateConvertResponse createConvert(CreateConvertRequest creatConvertRequest) {
        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        UUID userUuid = currentUserUuid.get();

        CompressionType compressionType = compressionTypeRepository.findByUuid(
                        creatConvertRequest.compressionTypeUuid())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        String bmpKey = S3Util.extractKeyFromUrl(creatConvertRequest.bmpUrl());
        String bmpFileName = S3Util.extractOriginalFileName(bmpKey);
        String tiffFileName = S3Util.toTiffFileName(bmpFileName);
        CreateTiffUploadResponse createTiffUploadResponse = filePresignedService.createTiffUpload(
                tiffFileName);
        String tiffKey = S3Util.extractKeyFromUrl(createTiffUploadResponse.uploadUrl());

        ConvertHistory convertHistory = creatConvertRequest.toEntity(bmpKey, tiffKey,
                LocalDateTime.now(), compressionType, user);
        convertHistoryRepository.save(convertHistory);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String accessToken = (String) authentication.getCredentials();

        Auth auth = new Auth("Bearer", accessToken);
        ConvertImageRequest convertImageRequest = new ConvertImageRequest(
                creatConvertRequest.bmpUrl(), createTiffUploadResponse.uploadUrl(),
                compressionType.getCompressionType(),
                compressionType.getProcessingUnit(), 24, convertHistory.getUuid(), auth);
        externalApiClient.requestConvert(convertImageRequest);

        return new CreateConvertResponse(convertHistory.getUuid());
    }

    @Override
    @Transactional
    public void completeConvert(UUID convertUuid, CompleteConvertRequest completeConvertRequest) {
        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        UUID userUuid = currentUserUuid.get();
        if (completeConvertRequest.isSuccess()) {
            ConvertHistory convertHistory = convertHistoryRepository.findByUuid(convertUuid)
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

            convertHistory.update(completeConvertRequest);

            ConvertHistoryItemResponse convertHistoryItemResponse = ConvertHistoryItemResponse.fromEntity(
                    convertHistory);
            sseService.sentToClient(userUuid, SSE_EVENT_SUCCESS, convertHistoryItemResponse);
        } else {
            sseService.sentToClient(userUuid, SSE_EVENT_FAILED, ErrorCode.SSE_GENERATION_FAILED);
        }
    }
}
