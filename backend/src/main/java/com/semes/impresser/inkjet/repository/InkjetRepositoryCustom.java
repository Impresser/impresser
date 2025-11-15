package com.semes.impresser.inkjet.repository;

import com.semes.impresser.dashboard.dto.response.InkjetDailyUsageStatResponse;
import com.semes.impresser.inkjet.dto.response.AllInkjetResponse;
import com.semes.impresser.inkjet.dto.response.InkjetResponse;
import com.semes.impresser.inkjet.dto.response.TotalJobResponse;
import com.semes.impresser.inkjet.entity.JobHistory;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InkjetRepositoryCustom {

    Page<AllInkjetResponse> getAllInkjets(String printerName, String printerStatus,
        String processStatus, LocalDate installDate, Pageable pageable);

    InkjetResponse getInkjet(UUID inkjetUuid);

    Page<JobHistory> getJobHistories(UUID inkjetUuid, Pageable pageable);

    TotalJobResponse getTotalJob();

    List<InkjetDailyUsageStatResponse> getDailyAvgUsage(
        LocalDate startDate, LocalDate endDate);
}
