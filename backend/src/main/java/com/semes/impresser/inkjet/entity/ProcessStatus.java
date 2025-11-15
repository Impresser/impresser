package com.semes.impresser.inkjet.entity;

import com.semes.impresser.common.exception.BusinessException;
import com.semes.impresser.common.exception.ErrorCode;

public enum ProcessStatus {
    WAITING,
    RUNNING;

    public static ProcessStatus from(String value) {
        try {
            return ProcessStatus.valueOf(value.toUpperCase());
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }
}
