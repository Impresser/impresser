package com.semes.impresser.s3.controller;

import com.semes.impresser.common.response.BaseResponse;
import com.semes.impresser.s3.dto.request.CompleteMultipartUploadRequest;
import com.semes.impresser.s3.dto.response.InitMultipartUploadResponse;
import com.semes.impresser.s3.dto.response.PresignedUrlListResponse;
import com.semes.impresser.s3.service.FilePresignedService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
public class S3Controller {

    private final FilePresignedService filePresignedService;

    @PostMapping("/bmp/init")
    @Operation(summary = "BMP 멀티파트 업로드 초기화")
    public BaseResponse<InitMultipartUploadResponse> init(@RequestParam String fileName) {
        InitMultipartUploadResponse initMultipartUploadResponse =
            filePresignedService.initMultipartUpload("bmp", fileName);

        return BaseResponse.onSuccess(initMultipartUploadResponse);
    }

    @GetMapping("/urls")
    @Operation(summary = "Presigned URL 목록 발급")
    public BaseResponse<PresignedUrlListResponse> getUrls(
        @RequestParam String objectName,
        @RequestParam String uploadId,
        @RequestParam int partCount
    ) {
        PresignedUrlListResponse presignedUrlListResponseresponse =
            filePresignedService.createPartPresignedUrls(objectName, uploadId, partCount);

        return BaseResponse.onSuccess(presignedUrlListResponseresponse);
    }

    @PostMapping("/complete")
    @Operation(summary = "멀티파트 업로드 완료")
    public ResponseEntity<BaseResponse<Void>> complete(
        @Valid @RequestBody CompleteMultipartUploadRequest completeMultipartUploadRequest
    ) {
        filePresignedService.completeMultipartUpload(completeMultipartUploadRequest);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(BaseResponse.onSuccess());
    }


    @DeleteMapping("/abort")
    @Operation(summary = "멀티파트 업로드 중단")
    public ResponseEntity<BaseResponse<Void>> abort(
        @RequestParam String objectName,
        @RequestParam String uploadId
    ) {
        filePresignedService.abortMultipartUpload(objectName, uploadId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(BaseResponse.onSuccess());
    }
}
