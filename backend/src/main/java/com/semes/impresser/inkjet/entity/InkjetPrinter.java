package com.semes.impresser.inkjet.entity;

import com.semes.impresser.common.entity.BaseTimeEntity;
import com.semes.impresser.inkjet.dto.request.UpdateInkjetRequest;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;

@Entity
@Table(name = "inkjet_printer")
@Getter
@Builder(toBuilder = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InkjetPrinter extends BaseTimeEntity {

    @Column(name = "model_name", nullable = false)
    private String modelName;

    @Column(name = "printer_name", nullable = false)
    private String printerName;

    @Column(name = "install_date", nullable = false)
    private LocalDate installDate;

    @Column(name = "cpu", nullable = false)
    private String cpu;

    @Column(name = "gpu", nullable = false)
    private String gpu;

    @Enumerated(EnumType.STRING)
    @Column(name = "printer_status", nullable = false)
    private PrinterStatus printerStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "process_status", nullable = false)
    private ProcessStatus processStatus;

    @Column(name = "ram", length = 20, nullable = false)
    private String ram;

    @Column(name = "vram", length = 20, nullable = false)
    private String vram;

    @Column(name = "canvas_x", nullable = false)
    private Integer canvasX;

    @Column(name = "canvas_y", nullable = false)
    private Integer canvasY;

    public void update(UpdateInkjetRequest request) {
        if (request.modelName() != null) {
            this.modelName = request.modelName();
        }
        if (request.printerName() != null) {
            this.printerName = request.printerName();
        }
        if (request.cpu() != null) {
            this.cpu = request.cpu();
        }
        if (request.gpu() != null) {
            this.gpu = request.gpu();
        }
        if (request.ram() != null) {
            this.ram = request.ram();
        }
        if (request.vram() != null) {
            this.vram = request.vram();
        }
        if (request.canvasX() != null) {
            this.canvasX = request.canvasX();
        }
        if (request.canvasY() != null) {
            this.canvasY = request.canvasY();
        }
        if (request.printerStatus() != null) {
            this.printerStatus = PrinterStatus.from(request.printerStatus());
        }
    }

    public void deleteInkjet() {
        this.deletedAt = LocalDateTime.now();
    }

    public void updateProcessStatus(ProcessStatus processStatus) {
        this.processStatus = processStatus;
    }
}
