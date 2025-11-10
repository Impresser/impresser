package com.semes.impresser.convertImage.controller;

import com.semes.impresser.common.response.BaseResponse;
import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.convertImage.dto.request.CompleteConvertRequest;
import com.semes.impresser.convertImage.dto.request.CreateConvertRequest;
import com.semes.impresser.convertImage.dto.response.CompressionTypeResponse;
import com.semes.impresser.convertImage.dto.response.CompressionTypeVersionResponse;
import com.semes.impresser.convertImage.dto.response.ConvertHistoryDetailResponse;
import com.semes.impresser.convertImage.dto.response.ConvertHistoryItemResponse;
import com.semes.impresser.convertImage.dto.response.CreateConvertResponse;
import com.semes.impresser.convertImage.service.ConvertImageService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/convert")
@RequiredArgsConstructor
public class ConvertImageController {

    private final ConvertImageService convertImageService;

    @GetMapping("/compression-type")
    @Operation(summary = "압축 방식(알고리즘) 조회")
    public BaseResponse<List<CompressionTypeResponse>> getCompressionTypes(
        @RequestParam String processingUnit
    ) {
        List<CompressionTypeResponse> compressionTypes = convertImageService.getCompressionTypes(
            processingUnit);
        return BaseResponse.onSuccess(compressionTypes);
    }

    @GetMapping("/compression-type/{compressionTypeUuid}/versions")
    @Operation(summary = "압축 방식 버전 목록 조회")
    public BaseResponse<List<CompressionTypeVersionResponse>> getCompressionTypeVersions(
        @PathVariable UUID compressionTypeUuid
    ) {
        List<CompressionTypeVersionResponse> versions =
            convertImageService.getVersionsByCompressionTypeUuid(compressionTypeUuid);
        return BaseResponse.onSuccess(versions);
    }

    @GetMapping("/histories")
    @Operation(summary = "압축 변환 내역(완료) 목록 조회")
    public BaseResponse<PageResponse<ConvertHistoryItemResponse>> getCompletedHistories(
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "5") @Min(1) int size
    ) {
        PageResponse<ConvertHistoryItemResponse> convertHistoryItemResponse =
            convertImageService.getCompletedHistoryPage(page, size);

        return BaseResponse.onSuccess(convertHistoryItemResponse);
    }

    @GetMapping("/histories/{convertHistoryUuid}")
    @Operation(summary = "압축 변환 내역(완료) 상세 조회")
    public BaseResponse<ConvertHistoryDetailResponse> getCompletedHistoryDetail(
        @PathVariable UUID convertHistoryUuid
    ) {
        ConvertHistoryDetailResponse convertHistoryDetailResponse =
            convertImageService.getCompletedHistoryDetail(convertHistoryUuid);

        return BaseResponse.onSuccess(convertHistoryDetailResponse);
    }

    @PostMapping
    @Operation(summary = "압축 변환 요청")
    public BaseResponse<CreateConvertResponse> createConvert(
        @RequestBody @Valid CreateConvertRequest creatConvertRequest
    ) {
        CreateConvertResponse createConvertResponse = convertImageService.createConvert(
            creatConvertRequest);

        return BaseResponse.onSuccess(createConvertResponse);
    }

    @PostMapping("/{convertUuid}/complete")
    @Operation(summary = "압축 변환 완료 콜백")
    public void completeConvert(
        @PathVariable UUID convertUuid,
        @RequestBody CompleteConvertRequest completeConvertRequest
    ) {
        convertImageService.completeConvert(convertUuid, completeConvertRequest);
    }
}
