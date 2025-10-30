package com.semes.impresser.common.exception;

import com.semes.impresser.common.response.BaseResponse;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
@Hidden
public class GlobalExceptionHandler {

    /* 1) 비즈니스 예외 */
    @ExceptionHandler(BusinessException.class)
    protected ResponseEntity<BaseResponse<Void>> handleBusinessException(BusinessException e) {
        ErrorCode errorCode = e.getErrorCode();
        BaseResponse<Void> response = BaseResponse.onFailure(errorCode);

        log.warn("Business Exception Occurred: Code={}, Message={}", errorCode.name(),
            errorCode.getMessage());
        return ResponseEntity.status(errorCode.getStatus()).body(response);
    }

    /* 2) 권한 위반 */
    @ExceptionHandler(AccessDeniedException.class)
    protected ResponseEntity<BaseResponse<Void>> handleAccessDeniedException(
        AccessDeniedException e) {
        ErrorCode errorCode = ErrorCode.PERMISSION_DENIED;
        BaseResponse<Void> response = BaseResponse.onFailure(errorCode);

        return ResponseEntity.status(errorCode.getStatus()).body(response);
    }

    /* 3) @Valid / @Validated 바인딩 오류 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    protected ResponseEntity<BaseResponse<Void>> handleValidationException(
        MethodArgumentNotValidException e) {

        Map<String, String> details = e.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage));
        BaseResponse<Void> response = BaseResponse.onFailure(ErrorCode.VALIDATION_FAILED, details);

        log.warn("Validation failed: {}", details);
        return ResponseEntity.status(ErrorCode.VALIDATION_FAILED.getStatus()).body(response);
    }

    /* 4) 파라미터 제약 조건(@Size 등) 위반 */
    @ExceptionHandler(ConstraintViolationException.class)
    protected ResponseEntity<BaseResponse<Void>> handleConstraintViolation(
        ConstraintViolationException e) {

        Map<String, String> details = e.getConstraintViolations().stream()
            .collect(Collectors.toMap(
                violation -> violation.getPropertyPath().toString(),
                ConstraintViolation::getMessage
            ));
        BaseResponse<Void> response = BaseResponse.onFailure(ErrorCode.VALIDATION_FAILED, details);

        log.warn("Constraint validation failed: {}", details);
        return ResponseEntity.status(ErrorCode.VALIDATION_FAILED.getStatus()).body(response);
    }

    /* 5) 그밖의 모든 예외 */
    @ExceptionHandler(Exception.class)
    protected ResponseEntity<BaseResponse<Void>> handleException(Exception e) {
        ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
        BaseResponse<Void> response = BaseResponse.onFailure(errorCode);

        log.error("Unhandled exception", e);
        return ResponseEntity.status(errorCode.getStatus()).body(response);
    }
}
