package com.semes.impresser.convertImage.repository;

import com.semes.impresser.convertImage.entity.ConvertHistory;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConvertHistoryRepository extends JpaRepository<ConvertHistory, Long>,
    ConvertHistoryRepositoryCustom {

    Optional<ConvertHistory> findByUuid(UUID uuid);
}
