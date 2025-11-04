package com.semes.impresser.generateImage.service;

import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.common.service.SseService;
import com.semes.impresser.generateImage.dto.response.CreateBmpImageAsyncResponse;
import com.semes.impresser.generateImage.entity.GenerationHistory;
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

    private static final String SSE_EVENT_SUCCESS = "GENERATE_BMP_SUCCESS";
    private static final String SSE_EVENT_FAILED = "GENERATE_BMP_FAILED";

    @Async("imageGenerationExecutor")
    public void createBmpImageAsync(Long generationHistoryId, UUID userUuid) {
        try {
            txService.markRunning(generationHistoryId);
            //todo : 이미지 생성 로직 c++ 호출

            //todo : test 용 추후 삭제 예정
            Thread.sleep(3000);
            String objectKey = "generated/" + generationHistoryId + ".bmp";

            GenerationHistory generationHistory = txService.markCompleted(generationHistoryId,
                objectKey);

            CreateBmpImageAsyncResponse createBmpImageAsyncResponse = CreateBmpImageAsyncResponse.success(
                generationHistory, objectKey);

            sseService.sentToClient(userUuid, SSE_EVENT_SUCCESS,
                createBmpImageAsyncResponse);

            log.info("[BMP 생성 완료] userUuid={}, generationHistoryId={}, key={}",
                userUuid, generationHistoryId, objectKey);

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

