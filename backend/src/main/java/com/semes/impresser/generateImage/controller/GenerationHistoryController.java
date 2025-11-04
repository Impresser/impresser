package com.semes.impresser.generateImage.controller;

import com.semes.impresser.common.response.BaseResponse;
import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.generateImage.dto.request.CreateBmpImageRequest;
import com.semes.impresser.generateImage.dto.response.AllGenerationHistoryResponse;
import com.semes.impresser.generateImage.dto.response.CreateBmpImageResponse;
import com.semes.impresser.generateImage.dto.response.GenerationHistoryResponse;
import com.semes.impresser.generateImage.service.GenerationHistoryService;
import com.semes.impresser.inkjet.dto.response.AllInkjetResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/bmp")
@RequiredArgsConstructor
public class GenerationHistoryController {

    public final GenerationHistoryService generationHistoryService;

    @PostMapping
    @Operation(summary = "패턴 생성")
    public ResponseEntity<BaseResponse<CreateBmpImageResponse>> createBmpImage(
        @RequestBody @Valid CreateBmpImageRequest createBmpImageRequest) {
        CreateBmpImageResponse createBmpImageResponse = generationHistoryService.createBmpImage(
            createBmpImageRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BaseResponse.onSuccess(createBmpImageResponse));
    }

    @GetMapping("/{generationUuid}")
    @Operation(summary = "개별 이미지 생성 내역 상세 조회")
    public BaseResponse<GenerationHistoryResponse> getGenerationHistory(
        @PathVariable UUID generationUuid) {
        GenerationHistoryResponse generationHistoryResponse = generationHistoryService.getGenerationHistory(
            generationUuid);
        return BaseResponse.onSuccess(generationHistoryResponse);
    }

    @GetMapping
    @Operation(summary = "전체 이미지 생성 내역 목록 조회")
    public BaseResponse<PageResponse<AllGenerationHistoryResponse>> getAllGenerationHistories(
        @RequestParam(defaultValue = "0") @Min(0) Integer page,
        @RequestParam(defaultValue = "10") @Min(1) Integer size
    ) {
        PageResponse<AllGenerationHistoryResponse> pageResponse = generationHistoryService.getAllGenerationHistories(
            page, size);
        return BaseResponse.onSuccess(pageResponse);
    }

}
