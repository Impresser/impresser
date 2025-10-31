package com.semes.impresser.inkjet.controller;

import com.semes.impresser.common.entity.BaseEntity;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestParam;
import com.semes.impresser.common.response.BaseResponse;
import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.inkjet.dto.request.CreateInkjetRequest;
import com.semes.impresser.inkjet.dto.request.UpdateInkjetRequest;
import com.semes.impresser.inkjet.dto.response.AllInkjetResponse;
import com.semes.impresser.inkjet.service.InkjetService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/inkjet-printer")
@RequiredArgsConstructor
public class InkjetController {

    private final InkjetService inkjetService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    @Operation(summary = "잉크젯 설비 등록")
    public ResponseEntity<BaseResponse<Void>> createInkjet(
        @Valid CreateInkjetRequest createInkjetRequest) {
        inkjetService.createInkjet(createInkjetRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(BaseResponse.onSuccess());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{inkjetUuid}")
    @Operation(summary = "잉크젯 설비 수정")
    public ResponseEntity<BaseResponse<Void>> updateInkjet(
        @Valid UpdateInkjetRequest updateInkjetRequest,
        @PathVariable UUID inkjetUuid) {
        inkjetService.updateInkjet(inkjetUuid, updateInkjetRequest);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(BaseResponse.onSuccess());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{inkjetUuid}")
    @Operation(summary = "잉크젯 설비 삭제")
    public ResponseEntity<BaseResponse<Void>> deleteInkjet(
        @PathVariable UUID inkjetUuid) {
        inkjetService.deleteInkjet(inkjetUuid);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(BaseResponse.onSuccess());
    }

    @GetMapping
    @Operation(summary = "잉크젯 설비 목록 조회")
    public BaseResponse<PageResponse<AllInkjetResponse>> getAllInkjets(
        @RequestParam(required = false) String printerName,
        @RequestParam(required = false) String printerStatus,
        @RequestParam(required = false) String processStatus,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate installDate,
        @RequestParam(defaultValue = "0") @Min(0) Integer page,
        @RequestParam(defaultValue = "10") @Min(1) Integer size
    ) {
        PageResponse<AllInkjetResponse> pageResponse = inkjetService.getAllInkjets(
            printerName, printerStatus, processStatus, installDate, page, size);
        return BaseResponse.onSuccess(pageResponse);
    }
}
