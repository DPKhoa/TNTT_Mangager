package com.example.tntt_Manager.dto.response;

import com.example.tntt_Manager.entity.ClassEnrollment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
public class ClassEnrollmentResponseDTO {

    private UUID enrollmentId;
    private UUID memberId;
    private String memberFullName;
    private UUID classroomId;
    private String className;
    private String academicYear;
    private LocalDate enrollmentDate;

    public static ClassEnrollmentResponseDTO from(ClassEnrollment enrollment) {
        return ClassEnrollmentResponseDTO.builder()
                .enrollmentId(enrollment.getId())
                .memberId(enrollment.getMember().getId())
                .memberFullName(enrollment.getMember().getFullName())
                .classroomId(enrollment.getClassroom().getId())
                .className(enrollment.getClassroom().getClassName())
                .academicYear(enrollment.getClassroom().getAcademicYear())
                .enrollmentDate(enrollment.getEnrollmentDate())
                .build();
    }
}
