package com.example.tntt_Manager.service;

import com.example.tntt_Manager.dto.request.AttendanceSessionRequestDTO;
import com.example.tntt_Manager.dto.request.BulkAttendanceSubmitDTO;
import com.example.tntt_Manager.dto.response.AttendanceReportResponseDTO;
import com.example.tntt_Manager.dto.response.AttendanceSessionResponseDTO;

public interface AttendanceService {

    AttendanceSessionResponseDTO createSession(AttendanceSessionRequestDTO dto);

    void submitAttendance(BulkAttendanceSubmitDTO dto);

    AttendanceReportResponseDTO getSessionReport(java.util.UUID sessionId);
}
