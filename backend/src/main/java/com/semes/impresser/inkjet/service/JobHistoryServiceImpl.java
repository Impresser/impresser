package com.semes.impresser.inkjet.service;

import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.common.util.SecurityUtil;
import com.semes.impresser.inkjet.dto.request.CreateJobHistoryRequest;
import com.semes.impresser.inkjet.dto.response.CreateJobHistoryResponse;
import com.semes.impresser.inkjet.entity.InkjetPrinter;
import com.semes.impresser.inkjet.entity.JobHistory;
import com.semes.impresser.inkjet.entity.ProcessStatus;
import com.semes.impresser.inkjet.repository.InkjetRepository;
import com.semes.impresser.inkjet.repository.JobHistoryRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JobHistoryServiceImpl implements JobHistoryService {

    private final JobHistoryRepository jobHistoryRepository;
    private final InkjetRepository inkjetRepository;

    @Override
    @Transactional
    public UUID createJobHistory(UUID inkjetUuid, CreateJobHistoryRequest createJobHistoryRequest) {
        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        InkjetPrinter inkjetPrinter = inkjetRepository.findByUuid(inkjetUuid).orElseThrow(
            () -> new BusinessException(ErrorCode.NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();

        JobHistory jobHistory = createJobHistoryRequest.toEntity(now, inkjetPrinter);

        JobHistory savedJobHistory = jobHistoryRepository.save(jobHistory);

        inkjetPrinter.updateProcessStatus(ProcessStatus.RUNNING);

        return savedJobHistory.getUuid();
    }

    @Override
    @Transactional
    public void updateJobHistory(UUID inkjetUuid, UUID jobHistoryUuid) {
        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        InkjetPrinter inkjetPrinter = inkjetRepository.findByUuid(inkjetUuid).orElseThrow(
            () -> new BusinessException(ErrorCode.NOT_FOUND));
        JobHistory jobHistory = jobHistoryRepository.findByUuid(jobHistoryUuid).orElseThrow(
            () -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!jobHistory.getPrinter().getUuid().equals(inkjetPrinter.getUuid())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        LocalDateTime now = LocalDateTime.now();

        jobHistory.updateCompletedAt(now);

        inkjetPrinter.updateProcessStatus(ProcessStatus.WAITING);
    }
}
