package com.semes.impresser.inkjet.service;

import com.semes.impresser.common.response.PageResponse;
import com.semes.impresser.inkjet.dto.request.CreateInkjetRequest;
import com.semes.impresser.inkjet.dto.request.UpdateInkjetRequest;
import com.semes.impresser.inkjet.dto.response.AllInkjetResponse;
import com.semes.impresser.inkjet.dto.response.InkjetResponse;
import com.semes.impresser.inkjet.dto.response.JobHistoryListResponse;
import com.semes.impresser.inkjet.dto.response.TotalJobResponse;
import java.time.LocalDate;
import java.util.UUID;

public interface InkjetService {

    void createInkjet(CreateInkjetRequest createInkjetRequest);

    void updateInkjet(UUID inkjetUuid, UpdateInkjetRequest updateInkjetRequest);

    void deleteInkjet(UUID inkjetUuid);

    PageResponse<AllInkjetResponse> getAllInkjets(String printerName, String printerStatus,
        String processStatus,
        LocalDate installDate, Integer page, Integer size);

    InkjetResponse getInkjet(UUID inkjetUuid);

    JobHistoryListResponse getJobHistories(UUID inkjetUuid, Integer page, Integer size);

    TotalJobResponse getTotalJob();
}
