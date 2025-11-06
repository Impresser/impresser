package com.semes.impresser.inkjet.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.semes.impresser.inkjet.entity.InkjetPrinterSlot;
import com.semes.impresser.inkjet.entity.QInkjetPrinterSlot;
import com.semes.impresser.inkjet.entity.SlotStatus;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class InkjetSlotRepositoryCustomImpl implements InkjetSlotRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final QInkjetPrinterSlot printerSlot = QInkjetPrinterSlot.inkjetPrinterSlot;

    @Override
    public InkjetPrinterSlot getFreeSlot() {

        InkjetPrinterSlot inkjetPrinterSlot = queryFactory.selectFrom(printerSlot)
            .where(printerSlot.printerUuid.isNull()
                .or(printerSlot.status.eq(SlotStatus.RETIRED)))
            .fetchFirst();

        return inkjetPrinterSlot;
    }
}
