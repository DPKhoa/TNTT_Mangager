package com.example.tntt_Manager.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class EnrollmentRequestDTO {

    @NotNull(message = "Member ID is required")
    private UUID memberId;

    @NotNull(message = "Classroom ID is required")
    private UUID classroomId;

    // Optional — defaults to today in the service layer if not provided
    private LocalDate enrollmentDate;
}
