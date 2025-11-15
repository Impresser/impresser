package com.semes.impresser.inkjet.repository;

import com.semes.impresser.inkjet.entity.InkjetPrinterSlot;
import com.semes.impresser.inkjet.entity.SlotStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InkjetSlotRepository extends JpaRepository<InkjetPrinterSlot, Long>,
    InkjetSlotRepositoryCustom {

    Optional<InkjetPrinterSlot> findByPrinterUuid(UUID printerUuid);

    Optional<InkjetPrinterSlot> findByPrinterUuidAndStatus(UUID printerUuid, SlotStatus slotStatus);

    boolean existsByPrinterUuid(UUID printerUuid);
}
