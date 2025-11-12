package com.semes.impresser.generateImage.service;

import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.generateImage.entity.GenerationHistory;
import com.semes.impresser.generateImage.repository.GenerationHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GenerateImageTransactionalService {

    private final GenerationHistoryRepository generationHistoryRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void setBmpKey(Long generationHistoryId, String bmpKey) {
        GenerationHistory generationHistory = generationHistoryRepository.findById(
            generationHistoryId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        generationHistory.updateBmpKey(bmpKey);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markRunning(Long generationHistoryId) {
        GenerationHistory generationHistory = generationHistoryRepository.findById(
            generationHistoryId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        generationHistory.markRunning();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public GenerationHistory markCompleted(Long generationHistoryId, String objectKey) {
        GenerationHistory generationHistory = generationHistoryRepository.findById(
            generationHistoryId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        generationHistory.markCompleted(objectKey);
        return generationHistory;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public GenerationHistory markFailed(Long generationHistoryId) {
        GenerationHistory generationHistory = generationHistoryRepository.findById(
            generationHistoryId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        generationHistory.markFailed();
        return generationHistory;
    }

}
