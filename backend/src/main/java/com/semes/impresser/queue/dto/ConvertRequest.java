package com.semes.impresser.queue.dto;

import com.semes.impresser.convertImage.dto.request.CreateConvertRequest;
import java.util.List;

public record ConvertRequest(
        List<CreateConvertRequest> createConvertRequests
) {

}
