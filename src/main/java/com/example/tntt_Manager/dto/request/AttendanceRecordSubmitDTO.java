package com.example.tntt_Manager.dto.request;

import com.example.tntt_Manager.entity.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class AttendanceRecordSubmitDTO {

    @NotNull(message = "Student ID is required")
    private UUID studentId;

    @NotNull(message = "Attendance status is required")
    private AttendanceStatus status;

    // Optional — ghi chú riêng cho từng học sinh (VD: "Báo phép qua điện thoại")
    private String remarks;
}
