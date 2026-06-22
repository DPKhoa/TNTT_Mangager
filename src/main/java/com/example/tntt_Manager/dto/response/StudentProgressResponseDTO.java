package com.example.tntt_Manager.dto.response;

import com.example.tntt_Manager.entity.StudentProgress;
import com.example.tntt_Manager.entity.enums.AcademicPerformance;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class StudentProgressResponseDTO {

    private UUID id;
    private UUID studentId;
    private String studentFullName;
    private UUID classroomId;
    private String classroomName;
    private String academicYear;
    private BigDecimal catechismScore;
    private BigDecimal attendanceScore;
    private AcademicPerformance performance;
    private boolean promoted;
    private String remarks;
    private OffsetDateTime updatedAt;

    public static StudentProgressResponseDTO from(StudentProgress progress) {
        return StudentProgressResponseDTO.builder()
                .id(progress.getId())
                .studentId(progress.getStudent().getId())
                .studentFullName(progress.getStudent().getFullName())
                .classroomId(progress.getClassroom().getId())
                .classroomName(progress.getClassroom().getClassName())
                .academicYear(progress.getClassroom().getAcademicYear())
                .catechismScore(progress.getCatechismScore())
                .attendanceScore(progress.getAttendanceScore())
                .performance(progress.getPerformance())
                .promoted(progress.isPromoted())
                .remarks(progress.getRemarks())
                .updatedAt(progress.getUpdatedAt())
                .build();
    }
}
