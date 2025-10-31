package com.semes.impresser.inkjet.repository;

import com.semes.impresser.inkjet.dto.response.AllInkjetResponse;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InkjetRepositoryCustom {

    Page<AllInkjetResponse> getAllInkjets(String printerName, String printerStatus,
        String processStatus, LocalDate installDate, Pageable pageable);
}
