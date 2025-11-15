package com.semes.impresser.common.response;

public record PaginationResponse(
    int page,
    int size,
    int totalPages,
    long totalElements,
    boolean first,
    boolean last,
    boolean hasNext
) {

}
