package com.semes.impresser.inkjet.service;

import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.common.response.PaginationResponse;
import com.semes.impresser.common.util.SecurityUtil;
import com.semes.impresser.inkjet.dto.request.CreateInkjetRequest;
import com.semes.impresser.inkjet.dto.request.UpdateInkjetRequest;
import com.semes.impresser.inkjet.dto.response.AllInkjetResponse;
import com.semes.impresser.inkjet.entity.InkjetPrinter;
import com.semes.impresser.inkjet.entity.PrinterStatus;
import com.semes.impresser.inkjet.entity.ProcessStatus;
import com.semes.impresser.inkjet.repository.InkjetRepository;
import com.semes.impresser.inkjet.repository.InkjetRepositoryCustom;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InkjetServiceImpl implements InkjetService {

    private final InkjetRepository inkjetRepository;

    @Override
    public void createInkjet(CreateInkjetRequest createInkjetRequest) {
        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        PrinterStatus printerStatus = PrinterStatus.from(createInkjetRequest.printerStatus());

        ProcessStatus processStatus = ProcessStatus.from(createInkjetRequest.processStatus());

        InkjetPrinter inkjetPrinter = createInkjetRequest
            .toEntity(printerStatus, processStatus);

        inkjetRepository.save(inkjetPrinter);
    }

    @Override
    @Transactional
    public void updateInkjet(UUID inkjetUuid, UpdateInkjetRequest updateInkjetRequest) {
        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        InkjetPrinter inkjetPrinter = inkjetRepository.findByUuid(inkjetUuid).orElseThrow(
            () -> new BusinessException(ErrorCode.NOT_FOUND));

        inkjetPrinter.update(updateInkjetRequest);
    }

    @Override
    public void deleteInkjet(UUID inkjetUuid) {
        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        InkjetPrinter inkjetPrinter = inkjetRepository.findByUuid(inkjetUuid).orElseThrow(
            () -> new BusinessException(ErrorCode.NOT_FOUND));

        inkjetRepository.delete(inkjetPrinter);
    }

    @Override
    public PageResponse<AllInkjetResponse> getAllInkjets(String printerName, String printerStatus,
        String processStatus, LocalDate installDate, Integer page, Integer size) {
        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Pageable pageable = PageRequest.of(page, size);

        Page<AllInkjetResponse> allInkjetResponses = inkjetRepository.getAllInkjets(
            printerName, printerStatus, processStatus, installDate, pageable);

        Long totalElements = allInkjetResponses.getTotalElements();

        Integer totalPages = allInkjetResponses.getTotalPages();

        List<AllInkjetResponse> allInkjetResponseList = allInkjetResponses.getContent();

        PaginationResponse paginationResponse = new PaginationResponse(
            page,
            size,
            totalPages,
            totalElements,
            page == 0,
            page == totalPages - 1,
            page < totalPages - 1);

        PageResponse<AllInkjetResponse> pageResponse = new PageResponse<>(
            allInkjetResponseList, paginationResponse);

        return pageResponse;
    }
}
