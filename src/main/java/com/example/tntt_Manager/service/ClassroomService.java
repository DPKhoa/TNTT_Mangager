package com.example.tntt_Manager.service;

import com.example.tntt_Manager.dto.request.ClassroomRequestDTO;
import com.example.tntt_Manager.dto.request.EnrollmentRequestDTO;
import com.example.tntt_Manager.dto.response.ClassEnrollmentResponseDTO;
import com.example.tntt_Manager.dto.response.ClassroomResponseDTO;

import java.util.List;

public interface ClassroomService {

    ClassroomResponseDTO createClassroom(ClassroomRequestDTO dto);

    List<ClassroomResponseDTO> getClassroomsByYear(String academicYear);

    ClassEnrollmentResponseDTO enrollStudentToClass(EnrollmentRequestDTO dto);
}
