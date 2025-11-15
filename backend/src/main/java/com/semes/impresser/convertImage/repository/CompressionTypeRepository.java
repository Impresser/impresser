package com.semes.impresser.convertImage.repository;

import com.semes.impresser.convertImage.entity.CompressionType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompressionTypeRepository extends JpaRepository<CompressionType, Long>
    , CompressionTypeRepositoryCustom {

    List<CompressionType> findByProcessingUnitIgnoreCase(String processingUnit);

    Optional<CompressionType> findByUuid(UUID uuid);
}
