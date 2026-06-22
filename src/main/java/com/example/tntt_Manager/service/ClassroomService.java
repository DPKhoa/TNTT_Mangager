package com.example.tntt_Manager.service;

import com.example.tntt_Manager.dto.request.ClassroomRequestDTO;
import com.example.tntt_Manager.dto.request.EnrollmentRequestDTO;
import com.example.tntt_Manager.dto.response.ClassEnrollmentResponseDTO;
import com.example.tntt_Manager.dto.response.ClassroomResponseDTO;

import java.util.List;
import java.util.UUID;

public interface ClassroomService {

    ClassroomResponseDTO createClassroom(ClassroomRequestDTO dto);

    List<ClassroomResponseDTO> getClassroomsByYear(String academicYear);

    ClassroomResponseDTO updateClassroom(UUID id, ClassroomRequestDTO dto);

    void deleteClassroom(UUID id);

    ClassEnrollmentResponseDTO enrollStudentToClass(EnrollmentRequestDTO dto);
}
