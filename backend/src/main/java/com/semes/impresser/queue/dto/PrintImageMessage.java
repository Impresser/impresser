package com.semes.impresser.queue.dto;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PrintImageMessage implements Serializable {

    private static final long serialVersionUID = 1L;
    private UUID userUuid;
    private List<String> tiffKeys;
    private UUID printerUuid;

    public static PrintImageMessage toDto(
        UUID userUuid, UUID printerUuid, PrintRequest printRequest) {
        return PrintImageMessage.builder()
            .userUuid(userUuid)
            .tiffKeys(printRequest.tiffKeys())
            .printerUuid(printerUuid)
            .build();
    }
}
