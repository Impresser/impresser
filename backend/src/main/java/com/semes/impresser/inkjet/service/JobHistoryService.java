package com.semes.impresser.inkjet.service;

import com.semes.impresser.inkjet.dto.request.CreateJobHistoryRequest;
import java.util.UUID;

public interface JobHistoryService {

    UUID createJobHistory(UUID inkjetUuid, CreateJobHistoryRequest createJobHistoryRequest);

    void updateJobHistory(UUID inkjetUuid, UUID jobHistoryUuid);
}
