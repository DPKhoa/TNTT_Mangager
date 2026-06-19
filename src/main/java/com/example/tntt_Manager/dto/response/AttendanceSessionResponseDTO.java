package com.example.tntt_Manager.dto.response;

import com.example.tntt_Manager.entity.AttendanceSession;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class AttendanceSessionResponseDTO {

    private UUID id;
    private LocalDate sessionDate;
    private String description;
    private UUID classroomId;
    private String classroomName;
    private String academicYear;
    private OffsetDateTime createdAt;

    public static AttendanceSessionResponseDTO from(AttendanceSession session) {
        return AttendanceSessionResponseDTO.builder()
                .id(session.getId())
                .sessionDate(session.getSessionDate())
                .description(session.getDescription())
                .classroomId(session.getClassroom().getId())
                .classroomName(session.getClassroom().getClassName())
                .academicYear(session.getClassroom().getAcademicYear())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
