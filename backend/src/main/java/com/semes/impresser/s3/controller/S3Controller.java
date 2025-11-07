package com.semes.impresser.s3.controller;

import com.semes.impresser.common.response.BaseResponse;
import com.semes.impresser.s3.dto.request.CompleteBatchRequest;
import com.semes.impresser.s3.dto.request.CompleteMultipartRequest;
import com.semes.impresser.s3.dto.request.InitBmpBatchRequest;
import com.semes.impresser.s3.dto.request.TiffUploadItemRequest;
import com.semes.impresser.s3.dto.request.UrlsBatchRequest;
import com.semes.impresser.s3.dto.response.CompleteBatchResultResponse;
import com.semes.impresser.s3.dto.response.CreateTiffUploadResponse;
import com.semes.impresser.s3.dto.response.InitBmpBatchResponse;
import com.semes.impresser.s3.dto.response.InitMultipartUploadResponse;
import com.semes.impresser.s3.dto.response.PresignedUrlListResponse;
import com.semes.impresser.s3.dto.response.UrlsBatchResponse;
import com.semes.impresser.s3.service.FilePresignedService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/s3")
@RequiredArgsConstructor
@Validated
public class S3Controller {

    private final FilePresignedService filePresignedService;

    @PostMapping("/bmp/init")
    @Operation(summary = "BMP 멀티파트 업로드 초기화")
    public ResponseEntity<BaseResponse<InitMultipartUploadResponse>> init(
        @RequestParam String fileName
    ) {
        InitMultipartUploadResponse initMultipartUploadResponse =
            filePresignedService.initMultipartUpload("bmp", fileName);

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BaseResponse.onSuccess(initMultipartUploadResponse));
    }

    @GetMapping("/urls")
    @Operation(summary = "Presigned URL 목록 발급")
    public BaseResponse<PresignedUrlListResponse> getUrls(
        @RequestParam String objectName,
        @RequestParam String uploadId,
        @RequestParam int partCount
    ) {
        PresignedUrlListResponse presignedUrlListResponse =
            filePresignedService.createPartPresignedUrls(objectName, uploadId, partCount);

        return BaseResponse.onSuccess(presignedUrlListResponse);
    }

    @PostMapping("/complete")
    @Operation(summary = "멀티파트 업로드 완료")
    public ResponseEntity<BaseResponse<Void>> complete(
        @Valid @RequestBody CompleteMultipartRequest completeMultipartRequest
    ) {
        filePresignedService.completeMultipartUpload(completeMultipartRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BaseResponse.onSuccess());
    }

    @DeleteMapping("/abort")
    @Operation(summary = "멀티파트 업로드 중단")
    public ResponseEntity<BaseResponse<Void>> abort(
        @RequestParam String objectName,
        @RequestParam String uploadId
    ) {
        filePresignedService.abortMultipartUpload(objectName, uploadId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
            .body(BaseResponse.onSuccess());
    }

    @PostMapping("/bmp/init-batch")
    @Operation(summary = "BMP 멀티파트 업로드 초기화(배치)")
    public ResponseEntity<BaseResponse<InitBmpBatchResponse>> initBmpBatch(
        @RequestBody @Valid InitBmpBatchRequest initBmpBatchRequest
    ) {
        InitBmpBatchResponse initBmpBatchResponse = filePresignedService.initMultipartUploadBatch(
            initBmpBatchRequest.fileNames());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BaseResponse.onSuccess(initBmpBatchResponse));
    }

    @PostMapping("/bmp/urls-batch")
    @Operation(summary = "BMP 멀티파트 Presigned URL 배치 발급")
    public ResponseEntity<BaseResponse<UrlsBatchResponse>> urlsBatch(
        @RequestBody @Valid UrlsBatchRequest urlsBatchRequest
    ) {
        UrlsBatchResponse urlsBatchResponse = filePresignedService.createPartPresignedUrlsBatch(
            urlsBatchRequest.jobs());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BaseResponse.onSuccess(urlsBatchResponse));
    }

    @PostMapping("/bmp/complete-batch")
    @Operation(summary = "BMP 멀티파트 업로드 완료(배치)")
    public ResponseEntity<BaseResponse<CompleteBatchResultResponse>> completeBatch(
        @RequestBody @Valid CompleteBatchRequest completeBatchRequest
    ) {
        CompleteBatchResultResponse completeBatchResult =
            filePresignedService.completeMultipartUploadBatch(completeBatchRequest.items());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BaseResponse.onSuccess(completeBatchResult));
    }

    @PostMapping("/tiff/upload")
    @Operation(summary = "TIFF 단일 업로드용 Presigned PUT URL 발급")
    public ResponseEntity<BaseResponse<CreateTiffUploadResponse>> createTiffUpload(
        @RequestParam @NotBlank String fileName
    ) {
        CreateTiffUploadResponse response = filePresignedService.createTiffUpload(
            fileName);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BaseResponse.onSuccess(response));
    }

    @PostMapping("/tiff/upload-batch")
    @Operation(summary = "TIFF 다중 업로드용 Presigned PUT URL 발급")
    public ResponseEntity<BaseResponse<List<CreateTiffUploadResponse>>> createTiffUploadBatch(
        @RequestBody @Valid List<TiffUploadItemRequest> items
    ) {
        List<CreateTiffUploadResponse> response = filePresignedService.createTiffUploadBatch(
            items, "image/tiff");
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BaseResponse.onSuccess(response));
    }
}
