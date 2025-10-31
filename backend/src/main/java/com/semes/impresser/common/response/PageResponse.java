package com.semes.impresser.common.response;

import java.util.List;

public record PageResponse<T>(
    List<T> content,
    PaginationResponse pagination
) {

}
