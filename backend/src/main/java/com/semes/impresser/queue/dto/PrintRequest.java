package com.semes.impresser.queue.dto;

import java.util.List;

public record PrintRequest(
    List<String> tiffKeys
) {

}
