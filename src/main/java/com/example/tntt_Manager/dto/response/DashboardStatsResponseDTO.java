package com.example.tntt_Manager.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class DashboardStatsResponseDTO {

    private long   totalStudents;
    private long   activeLeaders;
    private long   totalClassrooms;
    private double weeklyAttendanceRate;   // percentage 0–100

    private List<WeeklyAttendanceDTO>   attendanceTrend;
    private List<BranchDistributionDTO> branchDistribution;
    private List<HighAbsenceClassDTO>   highAbsenceClasses;

    // ── Nested DTOs ─────────────────────────────────────────────────────────

    @Getter
    @Builder
    public static class WeeklyAttendanceDTO {
        private String week;     // "dd/MM" label shown on the X-axis
        private double rate;     // attendance rate in percent (0–100)
        private long   present;
        private long   total;
    }

    @Getter
    @Builder
    public static class BranchDistributionDTO {
        private String branch;   // enum name, e.g. "INFANT"
        private String label;    // Vietnamese label, e.g. "Ấu nhi"
        private long   count;
    }

    @Getter
    @Builder
    public static class HighAbsenceClassDTO {
        private String classroomName;
        private String academicYear;
        private long   absentCount;
        private long   totalCount;
        private double absenceRate;  // percentage 0–100
    }
}
