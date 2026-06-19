package com.example.tntt_Manager.dto.response;

import com.example.tntt_Manager.entity.AttendanceRecord;
import com.example.tntt_Manager.entity.AttendanceSession;
import com.example.tntt_Manager.entity.enums.AttendanceStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class AttendanceReportResponseDTO {

    private UUID sessionId;
    private LocalDate sessionDate;
    private String description;
    private String classroomName;
    private String academicYear;
    private List<RecordItem> records;

    // Static factory: nhận session + danh sách record, ghép thành một báo cáo hoàn chỉnh
    public static AttendanceReportResponseDTO from(AttendanceSession session,
                                                   List<AttendanceRecord> records) {
        return AttendanceReportResponseDTO.builder()
                .sessionId(session.getId())
                .sessionDate(session.getSessionDate())
                .description(session.getDescription())
                .classroomName(session.getClassroom().getClassName())
                .academicYear(session.getClassroom().getAcademicYear())
                .records(records.stream().map(RecordItem::from).toList())
                .build();
    }

    // Nested DTO — thông tin điểm danh của một học sinh trong buổi đó
    @Getter
    @Builder
    public static class RecordItem {

        private UUID recordId;
        private UUID memberId;
        private String memberFullName;
        private AttendanceStatus status;
        private String remarks;

        public static RecordItem from(AttendanceRecord record) {
            return RecordItem.builder()
                    .recordId(record.getId())
                    .memberId(record.getMember().getId())
                    .memberFullName(record.getMember().getFullName())
                    .status(record.getStatus())
                    .remarks(record.getRemarks())
                    .build();
        }
    }
}
