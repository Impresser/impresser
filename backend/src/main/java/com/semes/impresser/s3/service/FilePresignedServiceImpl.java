package com.semes.impresser.s3.service;

import com.semes.impresser.common.config.S3Config;
import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.common.util.S3Util;
import com.semes.impresser.s3.dto.request.CompleteMultipartRequest;
import com.semes.impresser.s3.dto.request.TiffUploadItemRequest;
import com.semes.impresser.s3.dto.request.UrlsBatchRequest;
import com.semes.impresser.s3.dto.response.CompleteBatchResultResponse;
import com.semes.impresser.s3.dto.response.CreateTiffUploadResponse;
import com.semes.impresser.s3.dto.response.InitBmpBatchResponse;
import com.semes.impresser.s3.dto.response.InitMultipartUploadResponse;
import com.semes.impresser.s3.dto.response.PresignedUrlListResponse;
import com.semes.impresser.s3.dto.response.UrlsBatchItemResponse;
import com.semes.impresser.s3.dto.response.UrlsBatchResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.AbortMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompleteMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompletedMultipartUpload;
import software.amazon.awssdk.services.s3.model.CompletedPart;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadResponse;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ListPartsRequest;
import software.amazon.awssdk.services.s3.model.ListPartsResponse;
import software.amazon.awssdk.services.s3.model.Part;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.UploadPartRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedUploadPartRequest;

@Service
@RequiredArgsConstructor
public class FilePresignedServiceImpl implements FilePresignedService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3Config s3Config;
    private final StringRedisTemplate redisTemplate;

    private String buildPublicUrl(String key) {
        return S3Util.buildUrlFromKey(key);
    }

    @Override
    public InitMultipartUploadResponse initMultipartUpload(String fileType, String fileName) {
        try {
            String uniqueFileName = UUID.randomUUID() + "_" + fileName;
            String objectName = String.format("%s/%s", fileType, uniqueFileName);

            CreateMultipartUploadResponse response = s3Client.createMultipartUpload(
                CreateMultipartUploadRequest.builder()
                    .bucket(s3Config.getBucket())
                    .key(objectName)
                    .contentType("image/bmp")
                    .build()
            );

            String imageUrl = buildPublicUrl(objectName);

            return new InitMultipartUploadResponse(
                response.uploadId(),
                objectName,
                fileName,
                uniqueFileName,
                imageUrl
            );

        } catch (Exception e) {
            e.printStackTrace();
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public PresignedUrlListResponse createPartPresignedUrls(String objectName, String uploadId,
        int partCount) {
        List<String> urls = new ArrayList<>();
        try {
            for (int partNumber = 1; partNumber <= partCount; partNumber++) {
                UploadPartRequest upr = UploadPartRequest.builder()
                    .bucket(s3Config.getBucket())
                    .key(objectName)
                    .uploadId(uploadId)
                    .partNumber(partNumber)
                    .build();

                PresignedUploadPartRequest presigned = s3Presigner.presignUploadPart(r -> r
                    .signatureDuration(Duration.ofMinutes(30))
                    .uploadPartRequest(upr));

                urls.add(presigned.url().toString());
            }

            redisTemplate.opsForValue()
                .set("upload:" + uploadId, String.valueOf(partCount), Duration.ofHours(1));

            return new PresignedUrlListResponse(urls);

        } catch (Exception e) {
            e.printStackTrace();
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public void completeMultipartUpload(
        CompleteMultipartRequest completeMultipartRequest) {
        try {
            List<Map<String, String>> parts = completeMultipartRequest.parts().stream()
                .map(p -> Map.of(
                    "partNumber", String.valueOf(p.partNumber()),
                    "etag", p.eTag()
                ))
                .toList();

            ListPartsResponse uploadedPartsResponse = s3Client.listParts(
                ListPartsRequest.builder()
                    .bucket(s3Config.getBucket())
                    .key(completeMultipartRequest.objectName())
                    .uploadId(completeMultipartRequest.uploadId())
                    .build()
            );

            List<Part> uploadedParts = uploadedPartsResponse.parts();

            String key = "upload:" + completeMultipartRequest.uploadId();
            String expectedCountStr = redisTemplate.opsForValue().get(key);
            int expectedCount = expectedCountStr != null ? Integer.parseInt(expectedCountStr) : -1;

            if (expectedCount > 0 && uploadedParts.size() != expectedCount) {
                throw new BusinessException(ErrorCode.INVALID_PART_COUNT);
            }

            if (uploadedParts.size() != parts.size()) {
                throw new BusinessException(ErrorCode.INVALID_PART_COUNT);
            }

            for (Map<String, String> p : parts) {
                int partNum = Integer.parseInt(p.get("partNumber"));
                boolean exists = uploadedParts.stream().anyMatch(up -> up.partNumber() == partNum);
                if (!exists) {
                    throw new BusinessException(ErrorCode.INVALID_PART_DATA);
                }
            }

            List<CompletedPart> completedParts = uploadedParts.stream()
                .map(p -> CompletedPart.builder()
                    .partNumber(p.partNumber())
                    .eTag(p.eTag())
                    .build())
                .toList();

            CompletedMultipartUpload completedMultipartUpload = CompletedMultipartUpload.builder()
                .parts(completedParts)
                .build();

            s3Client.completeMultipartUpload(
                CompleteMultipartUploadRequest.builder()
                    .bucket(s3Config.getBucket())
                    .key(completeMultipartRequest.objectName())
                    .uploadId(completeMultipartRequest.uploadId())
                    .multipartUpload(completedMultipartUpload)
                    .build()
            );

            redisTemplate.delete(key);

        } catch (S3Exception e) {
            e.printStackTrace();
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public void abortMultipartUpload(String objectName, String uploadId) {
        s3Client.abortMultipartUpload(
            AbortMultipartUploadRequest.builder()
                .bucket(s3Config.getBucket())
                .key(objectName)
                .uploadId(uploadId)
                .build()
        );

        redisTemplate.delete("upload:" + uploadId);
    }

    @Override
    public String getPresignedUrl(String objectName) {
        try {
            PresignedGetObjectRequest request = s3Presigner.presignGetObject(r -> r
                .signatureDuration(Duration.ofMinutes(30))
                .getObjectRequest(g -> g
                    .bucket(s3Config.getBucket())
                    .key(objectName)
                ));
            return request.url().toString();
        } catch (Exception e) {
            e.printStackTrace();
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public InitBmpBatchResponse initMultipartUploadBatch(List<String> fileNames) {
        List<InitMultipartUploadResponse> items = new ArrayList<>(fileNames.size());
        for (String fileName : fileNames) {
            InitMultipartUploadResponse init = initMultipartUpload("bmp", fileName);
            items.add(init);
        }
        InitBmpBatchResponse initBmpBatchResponse = new InitBmpBatchResponse(items);
        return initBmpBatchResponse;
    }

    @Override
    public String getDownloadPresignedUrl(String objectName) {
        try {
            String originalFileName = S3Util.extractOriginalFileName(objectName);

            PresignedGetObjectRequest request = s3Presigner.presignGetObject(r -> r
                .signatureDuration(Duration.ofMinutes(30))
                .getObjectRequest(g -> g
                    .bucket(s3Config.getBucket())
                    .key(objectName)
                    .responseContentDisposition(
                        "attachment; filename=\"" + originalFileName + "\""
                    )
                ));
            return request.url().toString();
        } catch (Exception e) {
            e.printStackTrace();
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public UrlsBatchResponse createPartPresignedUrlsBatch(List<UrlsBatchRequest.Job> jobs) {
        List<UrlsBatchItemResponse> items = new ArrayList<>(jobs.size());

        for (UrlsBatchRequest.Job j : jobs) {
            PresignedUrlListResponse urls =
                createPartPresignedUrls(j.objectName(), j.uploadId(), j.partCount());

            String imageUrl = buildPublicUrl(j.objectName());

            UrlsBatchItemResponse item = new UrlsBatchItemResponse(
                j.objectName(),
                j.uploadId(),
                urls,
                imageUrl
            );
            items.add(item);
        }
        UrlsBatchResponse urlsBatchResponse = new UrlsBatchResponse(items);
        return urlsBatchResponse;
    }

    @Override
    public CompleteBatchResultResponse completeMultipartUploadBatch(
        List<CompleteMultipartRequest> items) {
        List<String> ok = new ArrayList<>();
        Map<String, String> fail = new LinkedHashMap<>();

        for (CompleteMultipartRequest item : items) {
            try {
                completeMultipartUpload(item);
                ok.add(item.uploadId());
            } catch (BusinessException be) {
                fail.put(item.uploadId(), be.getErrorCode().name());
            } catch (Exception e) {
                fail.put(item.uploadId(), "INTERNAL_SERVER_ERROR");
            }
        }
        CompleteBatchResultResponse completeBatchResult = new CompleteBatchResultResponse(ok, fail);
        return completeBatchResult;
    }

    @Override
    public CreateTiffUploadResponse createTiffUpload(String fileName) {
        try {
            String savedFileName = UUID.randomUUID() + "_" + fileName;
            String objectName = "tiff/" + savedFileName;

            PutObjectRequest por = PutObjectRequest.builder()
                .bucket(s3Config.getBucket())
                .key(objectName)
                .contentType("image/tiff")
                .build();

            PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(b -> b
                .signatureDuration(Duration.ofMinutes(30))
                .putObjectRequest(por));

            String imageUrl = buildPublicUrl(objectName);

            return new CreateTiffUploadResponse(
                objectName, fileName, savedFileName, presigned.url().toString(), imageUrl
            );
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public List<CreateTiffUploadResponse> createTiffUploadBatch(
        List<TiffUploadItemRequest> items,
        String contentType) {
        List<CreateTiffUploadResponse> responses = new ArrayList<>();
        for (TiffUploadItemRequest it : items) {
            CreateTiffUploadResponse response = createTiffUpload(it.fileName());
            responses.add(response);
        }
        return responses;
    }

    @Override
    public void deleteByKey(String key) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
            .bucket(s3Config.getBucket())
            .key(key)
            .build());
    }
}
