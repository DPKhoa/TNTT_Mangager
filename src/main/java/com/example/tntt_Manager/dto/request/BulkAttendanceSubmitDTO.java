package com.example.tntt_Manager.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class BulkAttendanceSubmitDTO {

    @NotNull(message = "Session ID is required")
    private UUID sessionId;

    // @Valid bắt buộc để Jakarta Validation kiểm tra sâu vào từng phần tử trong List
    @Valid
    @NotEmpty(message = "Attendance records cannot be empty")
    private List<AttendanceRecordSubmitDTO> records;
}
