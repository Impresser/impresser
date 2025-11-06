package com.semes.impresser.s3.service;

import com.semes.impresser.s3.dto.request.CompleteMultipartRequest;
import com.semes.impresser.s3.dto.request.TiffUploadItemRequest;
import com.semes.impresser.s3.dto.request.UrlsBatchRequest;
import com.semes.impresser.s3.dto.response.CompleteBatchResultResponse;
import com.semes.impresser.s3.dto.response.CreateTiffUploadResponse;
import com.semes.impresser.s3.dto.response.InitBmpBatchResponse;
import com.semes.impresser.s3.dto.response.InitMultipartUploadResponse;
import com.semes.impresser.s3.dto.response.PresignedUrlListResponse;
import com.semes.impresser.s3.dto.response.UrlsBatchResponse;
import java.util.List;

public interface FilePresignedService {

    /**
     * 멀티파트 업로드 초기화
     */
    InitMultipartUploadResponse initMultipartUpload(String fileType, String fileName);

    /**
     * Presigned URL 생성
     */
    PresignedUrlListResponse createPartPresignedUrls(String objectName, String uploadId,
        int partCount);

    /**
     * 멀티파트 업로드 완료
     */
    void completeMultipartUpload(CompleteMultipartRequest completeMultipartRequest);

    /**
     * 멀티파트 업로드 중단
     */
    void abortMultipartUpload(String objectName, String uploadId);

    /**
     * 다운로드용 Presigned URL 생성
     */
    String getPresignedUrl(String objectName);

    CreateTiffUploadResponse createTiffUpload(String fileName, String contentType);

    /**
     * ========= 배치 =========
     */
    InitBmpBatchResponse initMultipartUploadBatch(List<String> fileNames);

    UrlsBatchResponse createPartPresignedUrlsBatch(List<UrlsBatchRequest.Job> jobs);

    CompleteBatchResultResponse completeMultipartUploadBatch(List<CompleteMultipartRequest> items);

    List<CreateTiffUploadResponse> createTiffUploadBatch(List<TiffUploadItemRequest> fileNames,
        String contentType);
}
