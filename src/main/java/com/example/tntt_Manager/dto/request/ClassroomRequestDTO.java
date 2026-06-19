package com.example.tntt_Manager.dto.request;

import com.example.tntt_Manager.entity.Classroom;
import com.example.tntt_Manager.entity.enums.Branch;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ClassroomRequestDTO {

    @NotBlank(message = "Class name is required")
    private String className;

    // Format expected: "2024-2025"
    @NotBlank(message = "Academic year is required")
    private String academicYear;

    @NotNull(message = "Division is required")
    private Branch division;

    public Classroom toEntity() {
        return Classroom.builder()
                .className(this.className)
                .academicYear(this.academicYear)
                .division(this.division)
                .build();
    }
}
