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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE_COMMITTEE', 'BRANCH_LEADER', 'CLASS_LEADER', 'GROUP_LEADER')")
    @PostMapping("/session")
    public ResponseEntity<AttendanceSessionResponseDTO> createSession(
            @Valid @RequestBody AttendanceSessionRequestDTO dto) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(attendanceService.createSession(dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE_COMMITTEE', 'BRANCH_LEADER', 'CLASS_LEADER', 'GROUP_LEADER')")
    @PostMapping("/submit")
    public ResponseEntity<Void> submitAttendance(
            @Valid @RequestBody BulkAttendanceSubmitDTO dto) {

        attendanceService.submitAttendance(dto);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<AttendanceReportResponseDTO> getSessionReport(
            @PathVariable UUID sessionId) {

        return ResponseEntity.ok(attendanceService.getSessionReport(sessionId));
    }
}
