package com.example.tntt_Manager.service.impl;

import com.example.tntt_Manager.dto.request.AttendanceRecordSubmitDTO;
import com.example.tntt_Manager.dto.request.AttendanceSessionRequestDTO;
import com.example.tntt_Manager.dto.request.BulkAttendanceSubmitDTO;
import com.example.tntt_Manager.dto.response.AttendanceReportResponseDTO;
import com.example.tntt_Manager.dto.response.AttendanceSessionResponseDTO;
import com.example.tntt_Manager.entity.AttendanceRecord;
import com.example.tntt_Manager.entity.AttendanceSession;
import com.example.tntt_Manager.entity.Classroom;
import com.example.tntt_Manager.entity.Member;
import com.example.tntt_Manager.exception.ResourceNotFoundException;
import com.example.tntt_Manager.repository.AttendanceRecordRepository;
import com.example.tntt_Manager.repository.AttendanceSessionRepository;
import com.example.tntt_Manager.repository.ClassroomRepository;
import com.example.tntt_Manager.repository.MemberRepository;
import com.example.tntt_Manager.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final ClassroomRepository classroomRepository;
    private final MemberRepository memberRepository;

    @Override
    @Transactional
    public AttendanceSessionResponseDTO createSession(AttendanceSessionRequestDTO dto) {
        Classroom classroom = classroomRepository.findById(dto.getClassroomId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Classroom not found with id: " + dto.getClassroomId()));

        AttendanceSession session = AttendanceSession.builder()
                .classroom(classroom)
                .sessionDate(dto.getSessionDate())
                .description(dto.getDescription())
                .build();

        return AttendanceSessionResponseDTO.from(sessionRepository.save(session));
    }

    @Override
    @Transactional
    public void submitAttendance(BulkAttendanceSubmitDTO dto) {
        AttendanceSession session = sessionRepository.findById(dto.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attendance session not found with id: " + dto.getSessionId()));

        // Xoá toàn bộ bản ghi cũ của buổi này trước khi lưu lại
        // → đảm bảo không trùng dữ liệu khi giáo viên nộp lại bảng điểm danh
        recordRepository.deleteBySessionId(session.getId());

        List<AttendanceRecord> records = dto.getRecords().stream()
                .map(recordDto -> buildRecord(session, recordDto))
                .toList();

        recordRepository.saveAll(records);
    }

    @Override
    public AttendanceReportResponseDTO getSessionReport(UUID sessionId) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attendance session not found with id: " + sessionId));

        List<AttendanceRecord> records = recordRepository.findBySessionId(sessionId);

        return AttendanceReportResponseDTO.from(session, records);
    }

    // Tách ra method riêng để giữ submitAttendance gọn, tránh lambda lồng nhau dài
    private AttendanceRecord buildRecord(AttendanceSession session,
                                         AttendanceRecordSubmitDTO dto) {
        Member member = memberRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Member not found with id: " + dto.getStudentId()));

        return AttendanceRecord.builder()
                .session(session)
                .member(member)
                .status(dto.getStatus())
                .remarks(dto.getRemarks())
                .build();
    }
}
