package com.semes.impresser.convertImage.entity;

import com.semes.impresser.common.entity.BaseEntity;
import com.semes.impresser.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "convert_history")
@Getter
@Builder(toBuilder = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConvertHistory extends BaseEntity {

    @Column(name = "bmp_volume", nullable = false)
    private Long bmpVolume;

    @Column(name = "bmp_width", nullable = false)
    private Long bmpWidth;

    @Column(name = "bmp_height", nullable = false)
    private Long bmpHeight;

    @Column(name = "tiff_key", length = 200)
    private String tiffKey;

    @Column(name = "tiff_volume")
    private Long tiffVolume;

    @Column(name = "tiff_width")
    private Long tiffWidth;

    @Column(name = "tiff_height")
    private Long tiffHeight;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "avg_gpu_utilization")
    private Long avgGpuUtilization;

    @Column(name = "avg_speed")
    private BigDecimal avgSpeed;

    @Column(name = "max_speed")
    private BigDecimal maxSpeed;

    @Column(name = "min_speed")
    private BigDecimal minSpeed;

    @Column(name = "compression_ratio")
    private Long compressionRatio;

    @Column(name = "compression_time")
    private Long compressionTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compression_type_id", nullable = false)
    private CompressionType compressionType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
