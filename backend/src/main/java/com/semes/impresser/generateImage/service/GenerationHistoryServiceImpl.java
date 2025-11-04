package com.semes.impresser.generateImage.service;

import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.common.response.PaginationResponse;
import com.semes.impresser.common.util.SecurityUtil;
import com.semes.impresser.generateImage.dto.request.CreateBmpImageRequest;
import com.semes.impresser.generateImage.dto.response.AllGenerationHistoryResponse;
import com.semes.impresser.generateImage.dto.response.CreateBmpImageResponse;
import com.semes.impresser.generateImage.dto.response.GenerationHistoryResponse;
import com.semes.impresser.generateImage.entity.GenerationHistory;
import com.semes.impresser.generateImage.entity.GenerationStatus;
import com.semes.impresser.generateImage.entity.QGenerationHistory;
import com.semes.impresser.generateImage.repository.GenerationHistoryRepository;
import com.semes.impresser.generateImage.repository.GenerationHistoryRepositoryCustom;
import com.semes.impresser.user.entity.QUser;
import com.semes.impresser.user.entity.User;
import com.semes.impresser.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerationHistoryServiceImpl implements GenerationHistoryService {

    private final UserRepository userRepository;
    private final GenerateImageWorker generateImageWorker;
    private final GenerationHistoryRepository generationHistoryRepository;

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

        generateImageWorker.createBmpImageAsync(savedGeneratedHistory.getId(), userUuid);
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
}
