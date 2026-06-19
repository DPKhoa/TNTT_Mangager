package com.example.tntt_Manager.controller;

import com.example.tntt_Manager.dto.request.AttendanceSessionRequestDTO;
import com.example.tntt_Manager.dto.request.BulkAttendanceSubmitDTO;
import com.example.tntt_Manager.dto.response.AttendanceReportResponseDTO;
import com.example.tntt_Manager.dto.response.AttendanceSessionResponseDTO;
import com.example.tntt_Manager.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    // POST /api/v1/attendance/session — Tạo buổi điểm danh mới cho một lớp
    @PostMapping("/session")
    public ResponseEntity<AttendanceSessionResponseDTO> createSession(
            @Valid @RequestBody AttendanceSessionRequestDTO dto) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(attendanceService.createSession(dto));
    }

    // POST /api/v1/attendance/submit — Nộp bảng điểm danh cả lớp (có thể nộp lại nhiều lần)
    @PostMapping("/submit")
    public ResponseEntity<Void> submitAttendance(
            @Valid @RequestBody BulkAttendanceSubmitDTO dto) {

        attendanceService.submitAttendance(dto);
        return ResponseEntity.noContent().build();
    }

    // GET /api/v1/attendance/session/{sessionId} — Xem kết quả điểm danh của một buổi
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<AttendanceReportResponseDTO> getSessionReport(
            @PathVariable UUID sessionId) {

        return ResponseEntity.ok(attendanceService.getSessionReport(sessionId));
    }
}
