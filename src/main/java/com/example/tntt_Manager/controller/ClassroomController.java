package com.example.tntt_Manager.controller;

import com.example.tntt_Manager.dto.request.ClassroomRequestDTO;
import com.example.tntt_Manager.dto.request.EnrollmentRequestDTO;
import com.example.tntt_Manager.dto.response.ClassEnrollmentResponseDTO;
import com.example.tntt_Manager.dto.response.ClassroomResponseDTO;
import com.example.tntt_Manager.service.ClassroomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;

    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE_COMMITTEE', 'BRANCH_LEADER')")
    @PostMapping
    public ResponseEntity<ClassroomResponseDTO> createClassroom(
            @Valid @RequestBody ClassroomRequestDTO dto) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(classroomService.createClassroom(dto));
    }

    @GetMapping
    public ResponseEntity<List<ClassroomResponseDTO>> getClassroomsByYear(
            @RequestParam String year) {

        return ResponseEntity.ok(classroomService.getClassroomsByYear(year));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE_COMMITTEE', 'BRANCH_LEADER')")
    @PostMapping("/enroll")
    public ResponseEntity<ClassEnrollmentResponseDTO> enrollStudentToClass(
            @Valid @RequestBody EnrollmentRequestDTO dto) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(classroomService.enrollStudentToClass(dto));
    }
}
