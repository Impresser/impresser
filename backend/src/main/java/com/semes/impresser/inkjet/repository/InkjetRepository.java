package com.semes.impresser.inkjet.repository;

import com.semes.impresser.inkjet.entity.InkjetPrinter;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InkjetRepository extends JpaRepository<InkjetPrinter, Long>, InkjetRepositoryCustom {

    Optional<InkjetPrinter> findByUuid(UUID uuid);
}
