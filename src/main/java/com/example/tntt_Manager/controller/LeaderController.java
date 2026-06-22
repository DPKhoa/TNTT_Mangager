package com.example.tntt_Manager.controller;

import com.example.tntt_Manager.dto.request.LeaderRequestDTO;
import com.example.tntt_Manager.dto.response.LeaderResponseDTO;
import com.example.tntt_Manager.service.LeaderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leaders")
@RequiredArgsConstructor
public class LeaderController {

    private final LeaderService leaderService;

    @GetMapping
    public ResponseEntity<Page<LeaderResponseDTO>> getAllLeaders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("fullName").ascending());
        return ResponseEntity.ok(leaderService.getAllLeaders(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<LeaderResponseDTO>> searchLeaders(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(leaderService.searchLeaders(keyword, pageable));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE_COMMITTEE')")
    @PostMapping
    public ResponseEntity<LeaderResponseDTO> createLeader(
            @Valid @RequestBody LeaderRequestDTO dto) {

        return ResponseEntity.status(HttpStatus.CREATED).body(leaderService.createLeader(dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE_COMMITTEE')")
    @PutMapping("/{id}")
    public ResponseEntity<LeaderResponseDTO> updateLeader(
            @PathVariable UUID id,
            @Valid @RequestBody LeaderRequestDTO dto) {

        return ResponseEntity.ok(leaderService.updateLeader(id, dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE_COMMITTEE')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLeader(@PathVariable UUID id) {
        leaderService.deleteLeader(id);
        return ResponseEntity.noContent().build();
    }
}
