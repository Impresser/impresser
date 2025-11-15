package com.semes.impresser.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.semes.impresser.common.exception.ErrorCode;
import java.util.Map;
import lombok.Getter;

@Getter
@JsonPropertyOrder({"isSuccess", "code", "message", "result", "details"})
public class BaseResponse<T> {

    private final Boolean isSuccess;
    private final String code;
    private final String message;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private T result;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Map<String, String> details;

    private BaseResponse() {
        this.isSuccess = true;
        this.code = "SUCCESS";
        this.message = "요청에 성공하였습니다.";
    }

    private BaseResponse(T result) {
        this.isSuccess = true;
        this.code = "SUCCESS";
        this.message = "요청에 성공하였습니다.";
        this.result = result;
    }

    private BaseResponse(ErrorCode errorCode) {
        this.isSuccess = false;
        this.code = errorCode.name();
        this.message = errorCode.getMessage();
    }

    private BaseResponse(ErrorCode errorCode, Map<String, String> details) {
        this.isSuccess = false;
        this.code = errorCode.name();
        this.message = errorCode.getMessage();
        this.details = details;
    }

    public static BaseResponse<Void> onSuccess() {
        return new BaseResponse<>();
    }

    public static <T> BaseResponse<T> onSuccess(T result) {
        return new BaseResponse<>(result);
    }

    public static <T> BaseResponse<T> onFailure(ErrorCode errorCode) {
        return new BaseResponse<>(errorCode);
    }

    public static <T> BaseResponse<T> onFailure(ErrorCode errorCode, Map<String, String> details) {
        return new BaseResponse<>(errorCode, details);
    }
}
