package com.semes.impresser.inkjet.entity;

import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;

public enum PrinterStatus {
    BROKEN,
    UNDER_REPAIR,
    OPERATIONAL;

    public static PrinterStatus from(String value) {
        try {
            return PrinterStatus.valueOf(value.toUpperCase());
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }
}
