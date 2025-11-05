package com.semes.impresser.s3.service;

import com.semes.impresser.s3.dto.request.CompleteMultipartUploadRequest;
import com.semes.impresser.s3.dto.response.InitMultipartUploadResponse;
import com.semes.impresser.s3.dto.response.CreateTiffUploadResponse;
import com.semes.impresser.s3.dto.response.PresignedUrlListResponse;

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
    void completeMultipartUpload(CompleteMultipartUploadRequest request);

    /**
     * 멀티파트 업로드 중단
     */
    void abortMultipartUpload(String objectName, String uploadId);

    /**
     * 다운로드용 Presigned URL 생성
     */
    String getPresignedUrl(String objectName);

    CreateTiffUploadResponse createTiffUpload(String fileName, String contentType);
}
