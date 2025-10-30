package com.semes.impresser.convertImage.entity;

import com.semes.impresser.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "compression_type")
@Getter
@Builder(toBuilder = true)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CompressionType extends BaseEntity {

    @Column(name = "compression_type", length = 20, nullable = false)
    private String compressionType;

    @Column(name = "processing_unit", length = 10, nullable = false)
    private String processingUnit;

    @Column(nullable = false)
    private Integer version;
}
