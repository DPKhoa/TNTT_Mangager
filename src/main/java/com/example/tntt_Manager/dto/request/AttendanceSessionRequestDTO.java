package com.example.tntt_Manager.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class AttendanceSessionRequestDTO {

    @NotNull(message = "Classroom ID is required")
    private UUID classroomId;

    @NotNull(message = "Session date is required")
    @PastOrPresent(message = "Session date cannot be in the future")
    private LocalDate sessionDate;

    // Optional — mô tả ngắn về buổi học (VD: "Buổi sinh hoạt tháng 6")
    private String description;
}
