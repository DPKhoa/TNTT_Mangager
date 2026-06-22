package com.example.tntt_Manager.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class EvaluateRequestDTO {

    @NotNull(message = "Student ID must not be null")
    private UUID studentId;

    @NotNull(message = "Classroom ID must not be null")
    private UUID classroomId;

    @NotNull(message = "Catechism score must not be null")
    @DecimalMin(value = "0.0", message = "Catechism score must be at least 0")
    @DecimalMax(value = "10.0", message = "Catechism score must not exceed 10")
    private Double catechismScore;

    @NotNull(message = "Attendance score must not be null")
    @DecimalMin(value = "0.0", message = "Attendance score must be at least 0")
    @DecimalMax(value = "10.0", message = "Attendance score must not exceed 10")
    private Double attendanceScore;

    @Size(max = 500, message = "Remarks must not exceed 500 characters")
    private String remarks;
}
