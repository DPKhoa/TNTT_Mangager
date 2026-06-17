package com.example.tntt_Manager.exception;

import java.time.Instant;

/**
 * Cấu trúc JSON chuẩn trả về cho client khi có lỗi.
 *
 * @param timestamp thời điểm xảy ra lỗi (ISO-8601 UTC)
 * @param status    HTTP status code
 * @param message   mô tả lỗi
 */
public record ErrorResponse(Instant timestamp, int status, String message) {}
