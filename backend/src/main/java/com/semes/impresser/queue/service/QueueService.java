package com.semes.impresser.queue.service;

import com.semes.impresser.queue.dto.ConvertRequest;
import com.semes.impresser.queue.dto.PrintRequest;
import java.util.UUID;


public interface QueueService {

    void enqueueInkjetPrinterJobs(UUID printerUuid, PrintRequest printRequest);

    void enqueueCompressImageJobs(ConvertRequest convertRequest);
}
