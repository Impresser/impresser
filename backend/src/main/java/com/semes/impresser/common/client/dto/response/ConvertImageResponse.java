package com.semes.impresser.common.client.dto.response;

import java.util.UUID;

public record ConvertImageResponse(
    String isSuccess,
    String status,
    UUID convertUuid
) {

}
