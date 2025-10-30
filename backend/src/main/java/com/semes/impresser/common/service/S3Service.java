package com.semes.impresser.common.service;

import com.semes.impresser.common.config.S3Config;
import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.http.Method;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class S3Service {

    private final MinioClient s3Client;
    private final S3Config s3Config;

    public String createPresignedUploadUrl(String objectName) {
        try {
            return s3Client.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.PUT)
                    .bucket(s3Config.getBucket())
                    .object(objectName)
                    .expiry((int) TimeUnit.MINUTES.toSeconds(10))
                    .build()
            );
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    public String createPresignedDownloadUrl(String objectName) {
        try {
            return s3Client.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(s3Config.getBucket())
                    .object(objectName)
                    .expiry((int) TimeUnit.MINUTES.toSeconds(10))
                    .build()
            );
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}
