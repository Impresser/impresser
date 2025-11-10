package com.semes.impresser.queue.dto;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PrintMessage implements Serializable {

    private UUID userUuid;
    private List<String> tiffKeys;
    private UUID printerUuid;

    public static PrintMessage toDto(
        UUID userUuid, UUID printerUuid, PrintRequest printRequest) {
        return PrintMessage.builder()
            .userUuid(userUuid)
            .tiffKeys(printRequest.tiffKeys())
            .printerUuid(printerUuid)
            .build();
    }
}
