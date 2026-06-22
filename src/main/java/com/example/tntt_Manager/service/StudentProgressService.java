package com.example.tntt_Manager.service;

import com.example.tntt_Manager.dto.response.StudentProgressResponseDTO;

import java.util.UUID;

public interface StudentProgressService {

    void updateFinalEvaluation(UUID studentId, UUID classroomId,
                               Double catechismScore, Double attendanceScore,
                               String remarks);

    StudentProgressResponseDTO getProgressByStudentAndClassroom(UUID studentId, UUID classroomId);
}
