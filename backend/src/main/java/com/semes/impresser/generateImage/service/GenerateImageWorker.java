package com.semes.impresser.generateImage.service;

import com.semes.impresser.common.client.ExternalApiClient;
import com.semes.impresser.common.client.dto.request.GenerateImageApiRequest;
import com.semes.impresser.common.client.dto.request.GenerateImageApiRequest.Auth;
import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.common.service.SseService;
import com.semes.impresser.common.util.S3Util;
import com.semes.impresser.generateImage.dto.response.CreateBmpImageAsyncResponse;
import com.semes.impresser.generateImage.entity.GenerationHistory;
import com.semes.impresser.generateImage.repository.GenerationHistoryRepository;
import com.semes.impresser.s3.dto.response.InitMultipartUploadResponse;
import com.semes.impresser.s3.dto.response.PresignedUrlListResponse;
import com.semes.impresser.s3.service.FilePresignedService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerateImageWorker {

    private final GenerateImageTransactionalService txService;
    private final SseService sseService;

    private final ExternalApiClient externalApiClient;
    private final GenerationHistoryRepository generationHistoryRepository;
    private final FilePresignedService filePresignedService;

    private static final long S3_PART_SIZE = 20 * 1024 * 1024;

    private static final String SSE_EVENT_FAILED = "GENERATE_BMP_FAILED";

    @Async("imageGenerationExecutor")
    public void createBmpImageAsync(Long generationHistoryId, UUID userUuid, String accessToken) {
        try {
            txService.markRunning(generationHistoryId);

            GenerationHistory generationHistory = generationHistoryRepository.findById(generationHistoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

            String bmpFileName = generationHistory.getUuid().toString() + ".bmp";

            InitMultipartUploadResponse initMultipartUploadResponse = filePresignedService.initMultipartUpload(
                "bmp", bmpFileName);
            String uploadId = initMultipartUploadResponse.uploadId();
            String objectName = initMultipartUploadResponse.objectName();
            String bmpKey = S3Util.extractKeyFromUrl(initMultipartUploadResponse.imageUrl());

            txService.setBmpKey(generationHistoryId, bmpKey);

            long volumeBytes = generationHistory.getBmpVolume();
            int partCount = (int) Math.ceil((double) volumeBytes / S3_PART_SIZE);
            if (partCount == 0) {
                partCount = 1;
            }

            PresignedUrlListResponse presignedUrlListResponse = filePresignedService.createPartPresignedUrls(
                objectName, uploadId, partCount);
            List<String> partUploadUrls = presignedUrlListResponse.urls();

            Auth auth = new Auth("Bearer", accessToken);

            GenerateImageApiRequest apiRequest = GenerateImageApiRequest.from(
                partUploadUrls,
                uploadId,
                objectName,
                auth,
                generationHistory
            );

            externalApiClient.requestGenerate(apiRequest);

            log.info("[BMP 생성 요청] C++ API 호출 완료 (멀티파트 {}개), historyId={}", partCount,
                generationHistoryId);

        } catch (Exception e) {
            log.error("[BMP 생성 실패] historyId={}, userUuid={}", generationHistoryId, userUuid, e);
            handleFailure(generationHistoryId, userUuid, e);
        }
    }

    private void handleFailure(Long generationHistoryId, UUID userUuid, Exception e) {
        try {
            String errorMessage = "이미지 생성 중 오류가 발생했습니다.";
            if (e != null && e.getMessage() != null && !e.getMessage().isBlank()) {
                errorMessage = e.getMessage();
            }
            GenerationHistory generationHistory = txService.markFailed(generationHistoryId);
            CreateBmpImageAsyncResponse createBmpImageAsyncResponse = CreateBmpImageAsyncResponse
                .failure(generationHistory, errorMessage);

            sseService.sentToClient(userUuid, SSE_EVENT_FAILED,
                createBmpImageAsyncResponse);
        } catch (Exception ex) {
            log.error("[BMP 실패 상태 반영 에러] historyId={}", generationHistoryId, ex);
            sseService.sentToClient(userUuid, SSE_EVENT_FAILED, ErrorCode.SSE_GENERATION_FAILED);
        }
    }
}

