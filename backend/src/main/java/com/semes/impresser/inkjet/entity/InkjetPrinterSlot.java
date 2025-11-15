package com.semes.impresser.inkjet.entity;

import com.semes.impresser.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "inkjet_printer_slot")
@Getter
@Builder(toBuilder = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InkjetPrinterSlot extends BaseTimeEntity {

    @Column(name = "printer_uuid", length = 16)
    public UUID printerUuid;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    public SlotStatus status;

    public void updatePrinterUuid(UUID printerUuid) {
        this.printerUuid = printerUuid;
    }

    public void updateStatus(SlotStatus status) {
        this.status = status;
    }
}
