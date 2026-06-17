package com.example.tntt_Manager.service;

import com.example.tntt_Manager.dto.request.GuardianRequestDTO;
import com.example.tntt_Manager.dto.request.MemberRequestDTO;
import com.example.tntt_Manager.dto.response.GuardianResponseDTO;
import com.example.tntt_Manager.dto.response.MemberResponseDTO;
import com.example.tntt_Manager.entity.enums.MemberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface MemberService {

    Page<MemberResponseDTO> getMembersByStatus(MemberStatus status, Pageable pageable);

    Page<MemberResponseDTO> searchMembers(String keyword, Pageable pageable);

    MemberResponseDTO createMember(MemberRequestDTO dto);

    MemberResponseDTO updateMember(UUID id, MemberRequestDTO dto);

    void deleteMember(UUID id);

    GuardianResponseDTO addGuardianToMember(UUID memberId, GuardianRequestDTO dto);
}
