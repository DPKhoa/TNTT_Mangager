package com.example.tntt_Manager.service.impl;

import com.example.tntt_Manager.dto.request.ClassroomRequestDTO;
import com.example.tntt_Manager.dto.request.EnrollmentRequestDTO;
import com.example.tntt_Manager.dto.response.ClassEnrollmentResponseDTO;
import com.example.tntt_Manager.dto.response.ClassroomResponseDTO;
import com.example.tntt_Manager.entity.ClassEnrollment;
import com.example.tntt_Manager.entity.Classroom;
import com.example.tntt_Manager.entity.Member;
import com.example.tntt_Manager.exception.ResourceNotFoundException;
import com.example.tntt_Manager.repository.ClassEnrollmentRepository;
import com.example.tntt_Manager.repository.ClassroomRepository;
import com.example.tntt_Manager.repository.MemberRepository;
import com.example.tntt_Manager.service.ClassroomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClassroomServiceImpl implements ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final ClassEnrollmentRepository classEnrollmentRepository;
    private final MemberRepository memberRepository;

    @Override
    @Transactional
    public ClassroomResponseDTO createClassroom(ClassroomRequestDTO dto) {
        Classroom saved = classroomRepository.save(dto.toEntity());
        return ClassroomResponseDTO.from(saved);
    }

    @Override
    public List<ClassroomResponseDTO> getClassroomsByYear(String academicYear) {
        return classroomRepository.findByAcademicYear(academicYear)
                .stream()
                .map(ClassroomResponseDTO::from)
                .toList();
    }

    @Override
    @Transactional
    public ClassEnrollmentResponseDTO enrollStudentToClass(EnrollmentRequestDTO dto) {
        Member member = memberRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Member not found with id: " + dto.getMemberId()));

        Classroom classroom = classroomRepository.findById(dto.getClassroomId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Classroom not found with id: " + dto.getClassroomId()));

        // Use today's date if the caller did not supply an explicit enrollment date
        LocalDate enrollmentDate = dto.getEnrollmentDate() != null
                ? dto.getEnrollmentDate()
                : LocalDate.now();

        ClassEnrollment enrollment = ClassEnrollment.builder()
                .member(member)
                .classroom(classroom)
                .enrollmentDate(enrollmentDate)
                .build();

        return ClassEnrollmentResponseDTO.from(classEnrollmentRepository.save(enrollment));
    }
}
