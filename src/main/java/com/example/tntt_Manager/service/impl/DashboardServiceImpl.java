package com.example.tntt_Manager.service.impl;

import com.example.tntt_Manager.dto.response.DashboardStatsResponseDTO;
import com.example.tntt_Manager.dto.response.DashboardStatsResponseDTO.BranchDistributionDTO;
import com.example.tntt_Manager.dto.response.DashboardStatsResponseDTO.HighAbsenceClassDTO;
import com.example.tntt_Manager.dto.response.DashboardStatsResponseDTO.WeeklyAttendanceDTO;
import com.example.tntt_Manager.entity.AttendanceRecord;
import com.example.tntt_Manager.entity.enums.AttendanceStatus;
import com.example.tntt_Manager.entity.enums.LeaderStatus;
import com.example.tntt_Manager.entity.enums.MemberStatus;
import com.example.tntt_Manager.repository.AttendanceRecordRepository;
import com.example.tntt_Manager.repository.ClassroomRepository;
import com.example.tntt_Manager.repository.LeaderRepository;
import com.example.tntt_Manager.repository.MemberRepository;
import com.example.tntt_Manager.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final MemberRepository          memberRepository;
    private final LeaderRepository          leaderRepository;
    private final ClassroomRepository       classroomRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

    private static final DateTimeFormatter WEEK_FMT = DateTimeFormatter.ofPattern("dd/MM");

    private static final Map<String, String> BRANCH_LABELS = Map.of(
            "INFANT",        "Ấu nhi",
            "JUNIOR",        "Thiếu nhi",
            "SENIOR",        "Nghĩa sĩ",
            "ADVENTURER",    "Hiệp sĩ",
            "SOLDIER",       "Chiến sĩ",
            "JUNIOR_LEADER", "Dự trưởng"
    );

    @Override
    public DashboardStatsResponseDTO getDashboardStats() {

        LocalDate today = LocalDate.now();

        // ── 1. Headline counts ────────────────────────────────────────────────
        long totalStudents  = memberRepository.countByStatus(MemberStatus.ACTIVE);
        long activeLeaders  = leaderRepository.countByStatus(LeaderStatus.ACTIVE);
        long totalClassrooms = classroomRepository.count();

        // ── 2. This-week attendance rate ─────────────────────────────────────
        LocalDate weekStart = today.minusDays(6);
        long thisPresent = attendanceRecordRepository
                .countBySessionDateBetweenAndStatus(weekStart, today, AttendanceStatus.PRESENT);
        long thisTotal   = attendanceRecordRepository
                .countBySessionDateBetween(weekStart, today);
        double weeklyRate = round1dp(thisTotal > 0 ? thisPresent * 100.0 / thisTotal : 0.0);

        // ── 3. Attendance trend — last 4 weeks ───────────────────────────────
        List<WeeklyAttendanceDTO> trend = new ArrayList<>();
        for (int weeksAgo = 3; weeksAgo >= 0; weeksAgo--) {
            LocalDate end   = today.minusDays(weeksAgo * 7L);
            LocalDate start = end.minusDays(6);
            long present = attendanceRecordRepository
                    .countBySessionDateBetweenAndStatus(start, end, AttendanceStatus.PRESENT);
            long total   = attendanceRecordRepository
                    .countBySessionDateBetween(start, end);
            trend.add(WeeklyAttendanceDTO.builder()
                    .week(end.format(WEEK_FMT))
                    .rate(round1dp(total > 0 ? present * 100.0 / total : 0.0))
                    .present(present)
                    .total(total)
                    .build());
        }

        // ── 4. Branch distribution ───────────────────────────────────────────
        List<Object[]> branchRows = memberRepository.countByBranchAndStatus(MemberStatus.ACTIVE);
        List<BranchDistributionDTO> branchDistribution = branchRows.stream()
                .map(row -> {
                    String branch = row[0].toString();
                    return BranchDistributionDTO.builder()
                            .branch(branch)
                            .label(BRANCH_LABELS.getOrDefault(branch, branch))
                            .count((Long) row[1])
                            .build();
                })
                .collect(Collectors.toList());

        // ── 5. High-absence classes (this week) ──────────────────────────────
        List<AttendanceRecord> weekRecords = attendanceRecordRepository
                .findWithClassroomByDateRange(weekStart, today);

        // Key = "className|academicYear", value = [absentCount, totalCount]
        Map<String, long[]> classStats = new LinkedHashMap<>();
        for (AttendanceRecord r : weekRecords) {
            String key = r.getSession().getClassroom().getClassName()
                    + "|"
                    + r.getSession().getClassroom().getAcademicYear();
            classStats.computeIfAbsent(key, k -> new long[2]);
            if (r.getStatus() != AttendanceStatus.PRESENT) classStats.get(key)[0]++;
            classStats.get(key)[1]++;
        }

        List<HighAbsenceClassDTO> highAbsenceClasses = classStats.entrySet().stream()
                .filter(e -> e.getValue()[1] > 0)
                .map(e -> {
                    String[] parts  = e.getKey().split("\\|", 2);
                    long absent     = e.getValue()[0];
                    long total      = e.getValue()[1];
                    return HighAbsenceClassDTO.builder()
                            .classroomName(parts[0])
                            .academicYear(parts.length > 1 ? parts[1] : "")
                            .absentCount(absent)
                            .totalCount(total)
                            .absenceRate(round1dp(absent * 100.0 / total))
                            .build();
                })
                .sorted(Comparator.comparingDouble(HighAbsenceClassDTO::getAbsenceRate).reversed())
                .limit(5)
                .collect(Collectors.toList());

        return DashboardStatsResponseDTO.builder()
                .totalStudents(totalStudents)
                .activeLeaders(activeLeaders)
                .totalClassrooms(totalClassrooms)
                .weeklyAttendanceRate(weeklyRate)
                .attendanceTrend(trend)
                .branchDistribution(branchDistribution)
                .highAbsenceClasses(highAbsenceClasses)
                .build();
    }

    private static double round1dp(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
