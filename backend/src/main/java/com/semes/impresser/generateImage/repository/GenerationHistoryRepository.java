package com.semes.impresser.generateImage.repository;

import com.semes.impresser.generateImage.entity.GenerationHistory;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GenerationHistoryRepository extends JpaRepository<GenerationHistory, Long>,
    GenerationHistoryRepositoryCustom {

    Optional<GenerationHistory> findByUuid(UUID generationUuid);
}
