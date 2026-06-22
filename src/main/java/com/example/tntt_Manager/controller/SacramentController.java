package com.example.tntt_Manager.controller;

import com.example.tntt_Manager.dto.response.SacramentResponseDTO;
import com.example.tntt_Manager.repository.SacramentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sacraments")
@RequiredArgsConstructor
public class SacramentController {

    private final SacramentRepository sacramentRepository;

    @GetMapping
    public ResponseEntity<List<SacramentResponseDTO>> getSacramentsByStudent(
            @RequestParam UUID studentId) {

        List<SacramentResponseDTO> result = sacramentRepository
                .findByStudentId(studentId)
                .stream()
                .map(SacramentResponseDTO::from)
                .toList();

        return ResponseEntity.ok(result);
    }
}
