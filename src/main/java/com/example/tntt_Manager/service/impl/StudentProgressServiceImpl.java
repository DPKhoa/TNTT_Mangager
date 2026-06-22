package com.example.tntt_Manager.service.impl;

import com.example.tntt_Manager.dto.response.StudentProgressResponseDTO;
import com.example.tntt_Manager.entity.Classroom;
import com.example.tntt_Manager.entity.Member;
import com.example.tntt_Manager.entity.StudentProgress;
import com.example.tntt_Manager.entity.enums.AcademicPerformance;
import com.example.tntt_Manager.exception.ResourceNotFoundException;
import com.example.tntt_Manager.repository.ClassroomRepository;
import com.example.tntt_Manager.repository.MemberRepository;
import com.example.tntt_Manager.repository.StudentProgressRepository;
import com.example.tntt_Manager.service.StudentProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentProgressServiceImpl implements StudentProgressService {

    private final StudentProgressRepository studentProgressRepository;
    private final MemberRepository memberRepository;
    private final ClassroomRepository classroomRepository;

    @Override
    @Transactional
    public void updateFinalEvaluation(UUID studentId, UUID classroomId,
                                      Double catechismScore, Double attendanceScore,
                                      String remarks) {
        Member student = memberRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with id: " + studentId));

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));

        StudentProgress progress = studentProgressRepository
                .findByStudentIdAndClassroomId(studentId, classroomId)
                .orElseGet(() -> StudentProgress.builder()
                        .student(student)
                        .classroom(classroom)
                        .build());

        // Weighted average: catechism is the primary subject (70%), attendance is secondary (30%)
        double weightedAverage = (catechismScore * 0.7) + (attendanceScore * 0.3);
        AcademicPerformance performance = resolvePerformance(weightedAverage);

        progress.setCatechismScore(BigDecimal.valueOf(catechismScore));
        progress.setAttendanceScore(BigDecimal.valueOf(attendanceScore));
        progress.setPerformance(performance);
        progress.setPromoted(performance != AcademicPerformance.WEAK);
        progress.setRemarks(remarks);

        studentProgressRepository.save(progress);
    }

    @Override
    public StudentProgressResponseDTO getProgressByStudentAndClassroom(UUID studentId, UUID classroomId) {
        StudentProgress progress = studentProgressRepository
                .findByStudentIdAndClassroomId(studentId, classroomId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No progress record found for student " + studentId + " in classroom " + classroomId));

        return StudentProgressResponseDTO.from(progress);
    }

    // Vietnamese grading scale (thang điểm 10): EXCELLENT ≥8.5, GOOD ≥7.0, AVERAGE ≥5.0, WEAK <5.0
    private AcademicPerformance resolvePerformance(double average) {
        if (average >= 8.5) return AcademicPerformance.EXCELLENT;
        if (average >= 7.0) return AcademicPerformance.GOOD;
        if (average >= 5.0) return AcademicPerformance.AVERAGE;
        return AcademicPerformance.WEAK;
    }
}
