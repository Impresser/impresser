package com.semes.impresser.queue.service;

import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.common.util.S3Util;
import com.semes.impresser.common.util.SecurityUtil;
import com.semes.impresser.convertImage.dto.request.CreateConvertRequest;
import com.semes.impresser.convertImage.entity.CompressionType;
import com.semes.impresser.convertImage.entity.ConvertHistory;
import com.semes.impresser.convertImage.repository.CompressionTypeRepository;
import com.semes.impresser.convertImage.repository.ConvertHistoryRepository;
import com.semes.impresser.inkjet.service.InkjetSlotService;
import com.semes.impresser.queue.dto.CompressImageMessage;
import com.semes.impresser.queue.dto.ConvertRequest;
import com.semes.impresser.queue.dto.PrintImageMessage;
import com.semes.impresser.queue.dto.PrintRequest;
import com.semes.impresser.queue.producer.ImageMessageProducer;
import com.semes.impresser.queue.producer.PrintMessageProducer;
import com.semes.impresser.s3.dto.response.CreateTiffUploadResponse;
import com.semes.impresser.s3.service.FilePresignedService;
import com.semes.impresser.user.entity.User;
import com.semes.impresser.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class QueueServiceImpl implements QueueService {

    private final ImageMessageProducer imageMessageProducer;
    private final PrintMessageProducer printMessageProducer;
    private final InkjetSlotService inkjetSlotService;
    private final CompressionTypeRepository compressionTypeRepository;
    private final UserRepository userRepository;
    private final FilePresignedService filePresignedService;
    private final ConvertHistoryRepository convertHistoryRepository;


    @Override
    public void enqueueInkjetPrinterJobs(UUID printerUuid, PrintRequest printRequest) {

        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        UUID userUuid = currentUserUuid.get();

        PrintImageMessage printImageMessage = PrintImageMessage.toDto(
            userUuid, printerUuid, printRequest);

        String routingKey = inkjetSlotService.getRoutingKey(printerUuid);

        printMessageProducer.sendPrintMessage(routingKey, printImageMessage);
    }

    @Override
    public void enqueueCompressImageJobs(ConvertRequest convertRequest) {

        List<CreateConvertRequest> createConvertRequests = convertRequest.createConvertRequests();
        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        UUID userUuid = currentUserUuid.get();
        User user = userRepository.findByUuid(userUuid)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String accessToken = (String) authentication.getCredentials();

        for (CreateConvertRequest createConvertRequest : createConvertRequests) {

            CompressionType compressionType = compressionTypeRepository.findByUuid(
                    createConvertRequest.compressionTypeUuid())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

            String bmpKey = S3Util.extractKeyFromUrl(createConvertRequest.bmpUrl());
            String bmpFileName = S3Util.extractOriginalFileName(bmpKey);
            String tiffFileName = S3Util.toTiffFileName(bmpFileName);

            CreateTiffUploadResponse createTiffUploadResponse = filePresignedService.createTiffUpload(
                tiffFileName);
            String tiffKey = S3Util.extractKeyFromUrl(createTiffUploadResponse.uploadUrl());

            ConvertHistory convertHistory = createConvertRequest.toEntity(bmpKey, tiffKey,
                LocalDateTime.now(), compressionType, user);
            convertHistoryRepository.save(convertHistory);

            CompressImageMessage.Auth auth = CompressImageMessage.Auth.of("Bearer", accessToken);
            CompressImageMessage message = CompressImageMessage.of(
                auth,
                createConvertRequest.bmpUrl(),
                createTiffUploadResponse.uploadUrl(),
                compressionType.getCompressionType(),
                compressionType.getProcessingUnit(),
                24,
                convertHistory.getUuid());

            String routingKey = getCompressRoutingKey(userUuid);
            imageMessageProducer.sendToCompressQueue(routingKey, message);
        }
    }

    private String getCompressRoutingKey(UUID userUuid) {
        int shardIndex = Math.abs(userUuid.hashCode()) % 32;
        return "compress.shard." + shardIndex;
    }
}
