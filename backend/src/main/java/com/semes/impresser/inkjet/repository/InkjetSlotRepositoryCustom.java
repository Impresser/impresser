package com.semes.impresser.inkjet.repository;

import com.semes.impresser.inkjet.entity.InkjetPrinterSlot;
import java.util.UUID;

public interface InkjetSlotRepositoryCustom {

    InkjetPrinterSlot getFreeSlot();
}
