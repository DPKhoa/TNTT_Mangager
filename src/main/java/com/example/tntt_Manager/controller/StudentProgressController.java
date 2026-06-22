package com.example.tntt_Manager.controller;

import com.example.tntt_Manager.dto.request.EvaluateRequestDTO;
import com.example.tntt_Manager.dto.response.StudentProgressResponseDTO;
import com.example.tntt_Manager.service.StudentProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/progress")
@RequiredArgsConstructor
public class StudentProgressController {

    private final StudentProgressService studentProgressService;

    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE_COMMITTEE', 'BRANCH_LEADER', 'CLASS_LEADER')")
    @PutMapping("/evaluate")
    public ResponseEntity<Void> evaluate(@Valid @RequestBody EvaluateRequestDTO dto) {
        studentProgressService.updateFinalEvaluation(
                dto.getStudentId(),
                dto.getClassroomId(),
                dto.getCatechismScore(),
                dto.getAttendanceScore(),
                dto.getRemarks()
        );
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<StudentProgressResponseDTO> getProgress(
            @RequestParam UUID studentId,
            @RequestParam UUID classroomId) {

        return ResponseEntity.ok(
                studentProgressService.getProgressByStudentAndClassroom(studentId, classroomId)
        );
    }
}
