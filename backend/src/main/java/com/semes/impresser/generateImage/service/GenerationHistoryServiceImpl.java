package com.semes.impresser.generateImage.service;

import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.common.response.PaginationResponse;
import com.semes.impresser.common.service.SseService;
import com.semes.impresser.common.util.SecurityUtil;
import com.semes.impresser.generateImage.dto.request.CompleteBmpGernerationRequest;
import com.semes.impresser.generateImage.dto.request.CreateBmpImageRequest;
import com.semes.impresser.generateImage.dto.response.AllGenerationHistoryResponse;
import com.semes.impresser.generateImage.dto.response.CreateBmpImageAsyncResponse;
import com.semes.impresser.generateImage.dto.response.CreateBmpImageResponse;
import com.semes.impresser.generateImage.dto.response.GenerationHistoryResponse;
import com.semes.impresser.generateImage.entity.GenerationHistory;
import com.semes.impresser.generateImage.entity.GenerationStatus;
import com.semes.impresser.generateImage.repository.GenerationHistoryRepository;
import com.semes.impresser.user.entity.User;
import com.semes.impresser.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerationHistoryServiceImpl implements GenerationHistoryService {

    private final UserRepository userRepository;
    private final GenerateImageWorker generateImageWorker;
    private final GenerationHistoryRepository generationHistoryRepository;
    private final GenerateImageTransactionalService txService;
    private final SseService sseService;

    public static final String GENERATE_BMP_SUCCESS = "GENERATE_BMP_SUCCESS";
    public static final String GENERATE_BMP_FAILED  = "GENERATE_BMP_FAILED";

    @Override
    public CreateBmpImageResponse createBmpImage(CreateBmpImageRequest createBmpImageRequest) {
        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        UUID userUuid = currentUserUuid.get();

        User user = userRepository.findByUuid(userUuid).orElseThrow(
            () -> new BusinessException(ErrorCode.NOT_FOUND));

        LocalDateTime requestedAt = LocalDateTime.now();

        GenerationHistory generationHistory = createBmpImageRequest.toEntity(requestedAt, user);

        GenerationHistory savedGeneratedHistory = generationHistoryRepository.save(
            generationHistory);

        CreateBmpImageResponse createBmpImageResponse = CreateBmpImageResponse.toDto(
            savedGeneratedHistory);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String accessToken = (String) authentication.getCredentials();

        generateImageWorker.createBmpImageAsync(savedGeneratedHistory.getId(), userUuid, accessToken);

        return createBmpImageResponse;
    }

    @Override
    public GenerationHistoryResponse getGenerationHistory(UUID generationUuid) {
        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        GenerationHistory generationHistory = generationHistoryRepository.findByUuid(generationUuid)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        boolean isCompleted = false;
        if (generationHistory.getStatus().equals(GenerationStatus.COMPLETED)) {
            isCompleted = true;
        }
        GenerationHistoryResponse generationHistoryResponse = GenerationHistoryResponse.toDto(
            generationHistory, isCompleted);

        return generationHistoryResponse;
    }

    @Override
    public PageResponse<AllGenerationHistoryResponse> getAllGenerationHistories(
        Integer page, Integer size) {
        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        Pageable pageable = PageRequest.of(page, size);

        Page<AllGenerationHistoryResponse> allGenerationHistoryResponses = generationHistoryRepository.getAllGenerationHistories(
            pageable);

        Long totalElements = allGenerationHistoryResponses.getTotalElements();

        Integer totalPages = allGenerationHistoryResponses.getTotalPages();

        List<AllGenerationHistoryResponse> allGenerationHistories = allGenerationHistoryResponses.getContent();

        PaginationResponse paginationResponse = new PaginationResponse(
            page,
            size,
            totalPages,
            totalElements,
            page == 0,
            page == totalPages - 1,
            page < totalPages - 1);

        PageResponse<AllGenerationHistoryResponse> pageResponse = new PageResponse<>(
            allGenerationHistories, paginationResponse);

        return pageResponse;
    }

    @Override
    public void processGenerationCompletion(UUID generationUuid, CompleteBmpGernerationRequest completeBmpGernerationRequest) {
        GenerationHistory history = generationHistoryRepository.findByUuid(generationUuid)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        User user = history.getUser();
        if (user == null) {
            log.error("[BMP 콜백] 치명적 오류: historyId={}에 User 정보가 없습니다.", history.getId());
            return;
        }

        UUID userUuid = user.getUuid();

        try {
            if (completeBmpGernerationRequest.isSuccess()) {
                log.info("[BMP 콜백 성공] C++ 작업 성공. userUuid={}, historyId={}", userUuid, history.getId());

                GenerationHistory completedHistory = txService.markCompleted(history.getId(), history.getBmpKey());

                CreateBmpImageAsyncResponse createBmpImageAsyncResponse = CreateBmpImageAsyncResponse.success(
                    completedHistory, completedHistory.getBmpKey());

                sseService.sentToClient(userUuid, GENERATE_BMP_SUCCESS, createBmpImageAsyncResponse);

            } else {
                log.warn("[BMP 콜백 실패] C++ 작업 실패. userUuid={}, historyId={}, error={}",
                    userUuid, history.getId(), completeBmpGernerationRequest.errorMessage());

                GenerationHistory failedHistory = txService.markFailed(history.getId());

                CreateBmpImageAsyncResponse createBmpImageAsyncResponse = CreateBmpImageAsyncResponse.failure(
                    failedHistory, completeBmpGernerationRequest.errorMessage());

                sseService.sentToClient(userUuid, GENERATE_BMP_FAILED, createBmpImageAsyncResponse);
            }
        } catch (Exception e) {
            log.error("[BMP 콜백 처리 실패] DB/SSE 처리 중 예외 발생. userUuid={}", userUuid, e);
            sseService.sentToClient(userUuid, GENERATE_BMP_FAILED, ErrorCode.SSE_GENERATION_FAILED);
        }
    }
}

