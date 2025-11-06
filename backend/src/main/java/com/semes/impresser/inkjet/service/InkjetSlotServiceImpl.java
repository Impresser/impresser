package com.semes.impresser.inkjet.service;

import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;
import com.semes.impresser.inkjet.entity.InkjetPrinterSlot;
import com.semes.impresser.inkjet.entity.SlotStatus;
import com.semes.impresser.inkjet.repository.InkjetSlotRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InkjetSlotServiceImpl implements InkjetSlotService {

    private final InkjetSlotRepository inkjetSlotRepository;

    @Override
    @Transactional(readOnly = true)
    public Long getActiveInkjetSlotId(UUID printerUuid) {

        InkjetPrinterSlot inkjetPrinterSlot = inkjetSlotRepository.findByPrinterUuidAndStatus(
                printerUuid, SlotStatus.ACTIVE)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        Long slotNumber = inkjetPrinterSlot.getId();
        return slotNumber;
    }

    @Override
    @Transactional(readOnly = true)
    public UUID getInkjetPrinterUuid(Long id) {

        InkjetPrinterSlot inkjetPrinterSlot = inkjetSlotRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        UUID printerUuid = inkjetPrinterSlot.getPrinterUuid();
        return printerUuid;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean getIsActive(UUID printerUuid) {

        InkjetPrinterSlot inkjetPrinterSlot = inkjetSlotRepository.findByPrinterUuid(printerUuid)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        boolean isActive = inkjetPrinterSlot.getStatus() == SlotStatus.ACTIVE;

        return isActive;
    }

    @Override
    @Transactional(readOnly = true)
    public String getRoutingKey(UUID printerUuid) {

        Long id = getActiveInkjetSlotId(printerUuid);

        String routingKey = "inkjet-" + id;
        return routingKey;
    }

    @Override
    @Transactional
    public Long assignToSlot(UUID printerUuid) {

        if (inkjetSlotRepository.existsByPrinterUuid(printerUuid)) {
            throw new BusinessException(ErrorCode.ALREADY_EXISTS);
        }

        InkjetPrinterSlot inkjetPrinterSlot = inkjetSlotRepository.getFreeSlot();

        if (inkjetPrinterSlot == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }

        inkjetPrinterSlot.updatePrinterUuid(printerUuid);
        inkjetPrinterSlot.updateStatus(SlotStatus.ACTIVE);

        return inkjetPrinterSlot.getId();
    }

    @Override
    @Transactional
    public void changeToDraining(UUID printerUuid) {

        InkjetPrinterSlot inkjetPrinterSlot = inkjetSlotRepository.findByPrinterUuid(printerUuid)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        inkjetPrinterSlot.updateStatus(SlotStatus.DRAINING);
    }

    @Override
    public void changeToActive(UUID printerUuid) {

        InkjetPrinterSlot inkjetPrinterSlot = inkjetSlotRepository.findByPrinterUuid(printerUuid)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        inkjetPrinterSlot.updateStatus(SlotStatus.ACTIVE);
    }

    @Override
    @Transactional
    public void retireSlot(UUID printerUuid) {

        InkjetPrinterSlot inkjetPrinterSlot = inkjetSlotRepository.findByPrinterUuid(printerUuid)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        inkjetPrinterSlot.updateStatus(SlotStatus.RETIRED);
        inkjetPrinterSlot.updatePrinterUuid(null);
    }

}
