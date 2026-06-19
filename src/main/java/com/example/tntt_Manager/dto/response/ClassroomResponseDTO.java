package com.example.tntt_Manager.dto.response;

import com.example.tntt_Manager.entity.Classroom;
import com.example.tntt_Manager.entity.enums.Branch;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class ClassroomResponseDTO {

    private UUID id;
    private String className;
    private String academicYear;
    private Branch division;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static ClassroomResponseDTO from(Classroom classroom) {
        return ClassroomResponseDTO.builder()
                .id(classroom.getId())
                .className(classroom.getClassName())
                .academicYear(classroom.getAcademicYear())
                .division(classroom.getDivision())
                .createdAt(classroom.getCreatedAt())
                .updatedAt(classroom.getUpdatedAt())
                .build();
    }
}
