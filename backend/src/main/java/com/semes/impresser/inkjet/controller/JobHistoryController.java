package com.semes.impresser.inkjet.controller;

import com.semes.impresser.common.response.BaseResponse;
import com.semes.impresser.inkjet.dto.request.CreateJobHistoryRequest;
import com.semes.impresser.inkjet.dto.response.CreateJobHistoryResponse;
import com.semes.impresser.inkjet.service.JobHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/inkjet-printer")
@RequiredArgsConstructor
public class JobHistoryController {

    private final JobHistoryService jobHistoryService;

    @PostMapping("/{inkjetUuid}")
    @Operation(summary = "잉크젯 설비 가동")
    public BaseResponse<CreateJobHistoryResponse> createJobHistory(
        @PathVariable UUID inkjetUuid,
        @Valid @RequestBody CreateJobHistoryRequest createJobHistoryRequest) {
        UUID jobHistoryUuid = jobHistoryService.createJobHistory(
            inkjetUuid, createJobHistoryRequest);
        return BaseResponse.onSuccess(new CreateJobHistoryResponse(jobHistoryUuid));
    }

    @PatchMapping("/{inkjetUuid}/jobs/{jobHistoryUuid}")
    @Operation(summary = "잉크젯 설비 가동 완료")
    public ResponseEntity<BaseResponse<Void>> updateJobHistory(
        @PathVariable UUID inkjetUuid, @PathVariable UUID jobHistoryUuid) {
        jobHistoryService.updateJobHistory(inkjetUuid, jobHistoryUuid);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(BaseResponse.onSuccess());
    }

}
