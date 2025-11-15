package com.semes.impresser.inkjet.service;

import com.semes.impresser.inkjet.entity.SlotStatus;
import java.util.UUID;

public interface InkjetSlotService {

    Long getActiveInkjetSlotId(UUID printerUuid);

    UUID getInkjetPrinterUuid(Long id);

    boolean getIsActive(UUID printerUuid);

    String getRoutingKey(UUID printerUuid);

    Long assignToSlot(UUID printerUuid);

    void changeToDraining(UUID printerUuid);

    void changeToActive(UUID printerUuid);

    void retireSlot(UUID printerUuid);
}
