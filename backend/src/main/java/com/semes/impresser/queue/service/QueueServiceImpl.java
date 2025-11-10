package com.semes.impresser.queue.service;

import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.common.util.SecurityUtil;
import com.semes.impresser.inkjet.service.InkjetSlotService;
import com.semes.impresser.queue.dto.PrintMessage;
import com.semes.impresser.queue.dto.PrintRequest;
import com.semes.impresser.queue.producer.ImageMessageProducer;
import com.semes.impresser.queue.producer.PrintMessageProducer;
import java.util.Optional;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class QueueServiceImpl implements QueueService {

    private final ImageMessageProducer imageMessageProducer;
    private final PrintMessageProducer printMessageProducer;
    private final InkjetSlotService inkjetSlotService;

    @Override
    public void enqueueInkjetPrinterJobs(UUID printerUuid, PrintRequest printRequest) {

        Optional<UUID> currentUserUuid = SecurityUtil.getCurrentUserUuid();

        if (currentUserUuid.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        UUID userUuid = currentUserUuid.get();

        PrintMessage printMessage = PrintMessage.toDto(
            userUuid, printerUuid, printRequest);

        String routingKey = inkjetSlotService.getRoutingKey(printerUuid);

        printMessageProducer.sendPrintMessage(routingKey, printMessage);
    }
}
