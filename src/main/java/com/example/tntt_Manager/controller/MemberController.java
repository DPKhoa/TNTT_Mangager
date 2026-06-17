package com.example.tntt_Manager.controller;

import com.example.tntt_Manager.dto.request.GuardianRequestDTO;
import com.example.tntt_Manager.dto.request.MemberRequestDTO;
import com.example.tntt_Manager.dto.response.GuardianResponseDTO;
import com.example.tntt_Manager.dto.response.MemberResponseDTO;
import com.example.tntt_Manager.entity.enums.MemberStatus;
import com.example.tntt_Manager.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping
    public ResponseEntity<Page<MemberResponseDTO>> getMembersByStatus(
            @RequestParam(defaultValue = "ACTIVE") MemberStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(memberService.getMembersByStatus(status, pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<MemberResponseDTO>> searchMembers(
            @RequestParam(name = "keyword") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(memberService.searchMembers(keyword, pageable));
    }

    @PostMapping
    public ResponseEntity<MemberResponseDTO> createMember(
            @Valid @RequestBody MemberRequestDTO dto) {

        return ResponseEntity.status(HttpStatus.CREATED).body(memberService.createMember(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MemberResponseDTO> updateMember(
            @PathVariable UUID id,
            @Valid @RequestBody MemberRequestDTO dto) {

        return ResponseEntity.ok(memberService.updateMember(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMember(@PathVariable UUID id) {
        memberService.deleteMember(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{memberId}/guardians")
    public ResponseEntity<GuardianResponseDTO> addGuardian(
            @PathVariable UUID memberId,
            @Valid @RequestBody GuardianRequestDTO dto) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(memberService.addGuardianToMember(memberId, dto));
    }
}
