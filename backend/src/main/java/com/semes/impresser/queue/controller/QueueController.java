package com.semes.impresser.queue.controller;

import com.semes.impresser.common.response.BaseResponse;
import com.semes.impresser.queue.dto.ConvertRequest;
import com.semes.impresser.queue.dto.PrintRequest;
import com.semes.impresser.queue.service.QueueService;
import io.swagger.v3.oas.annotations.Operation;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class QueueController {

    private final QueueService queueService;

    @PostMapping("/inkjet-printer/{printerUuid}/jobs")
    @Operation(summary = "잉크젯 설비 대기열 등록")
    public ResponseEntity<BaseResponse<Void>> enqueueInkjetPrinterJobs(
        @PathVariable UUID printerUuid, @RequestBody PrintRequest printRequest) {

        queueService.enqueueInkjetPrinterJobs(printerUuid, printRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(BaseResponse.onSuccess());
    }

    @PostMapping("/convert/jobs")
    @Operation(summary = "이미지 변환 대기열 등록")
    public ResponseEntity<BaseResponse<Void>> enqueueConvertJobs(
        @RequestBody ConvertRequest convertRequest) {

        queueService.enqueueCompressImageJobs(convertRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(BaseResponse.onSuccess());
    }
}
