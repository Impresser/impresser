package com.semes.impresser.generateImage.entity;

import com.semes.impresser.common.entity.BaseEntity;
import com.semes.impresser.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "generation_history")
@Getter
@Builder(toBuilder = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GenerationHistory extends BaseEntity {

    @Column(name = "bmp_key", length = 200)
    private String bmpKey;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private GenerationStatus status;

    @Column(name = "bmp_volume", nullable = false)
    private Long bmpVolume;

    @Column(name = "bmp_width", nullable = false)
    private Long bmpWidth;

    @Column(name = "bmp_height", nullable = false)
    private Long bmpHeight;

    @Column(name = "red_count_x", nullable = false)
    private int redCountX;

    @Column(name = "red_count_y", nullable = false)
    private int redCountY;

    @Column(name = "red_size_x", nullable = false)
    private int redSizeX;

    @Column(name = "red_size_y", nullable = false)
    private int redSizeY;

    @Column(name = "red_gap_x", nullable = false)
    private int redGapX;

    @Column(name = "red_gap_y", nullable = false)
    private int redGapY;

    @Column(name = "green_count_x", nullable = false)
    private int greenCountX;

    @Column(name = "green_count_y", nullable = false)
    private int greenCountY;

    @Column(name = "green_size_x", nullable = false)
    private int greenSizeX;

    @Column(name = "green_size_y", nullable = false)
    private int greenSizeY;

    @Column(name = "green_gap_x", nullable = false)
    private int greenGapX;

    @Column(name = "green_gap_y", nullable = false)
    private int greenGapY;

    @Column(name = "blue_count_x", nullable = false)
    private int blueCountX;

    @Column(name = "blue_count_y", nullable = false)
    private int blueCountY;

    @Column(name = "blue_size_x", nullable = false)
    private int blueSizeX;

    @Column(name = "blue_size_y", nullable = false)
    private int blueSizeY;

    @Column(name = "blue_gap_x", nullable = false)
    private int blueGapX;

    @Column(name = "blue_gap_y", nullable = false)
    private int blueGapY;

    @Column(name = "rg_gap_x", nullable = false)
    private int rgGapX;

    @Column(name = "rg_gap_y", nullable = false)
    private int rgGapY;

    @Column(name = "gb_gap_x", nullable = false)
    private int gbGapX;

    @Column(name = "gb_gap_y", nullable = false)
    private int gbGapY;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public void updateBmpKey(String bmpKey) {
        this.bmpKey = bmpKey;
    }

    public void markRunning() {
        this.status = GenerationStatus.RUNNING;
        this.startedAt = LocalDateTime.now();
    }

    public void markCompleted(String bmpKey) {
        this.status = GenerationStatus.COMPLETED;
        this.bmpKey = bmpKey;
        this.completedAt = LocalDateTime.now();
    }

    public void markFailed() {
        this.status = GenerationStatus.FAILED;
        this.completedAt = LocalDateTime.now();
    }
}
