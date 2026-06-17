package com.example.tntt_Manager.service;

import com.example.tntt_Manager.dto.request.LeaderRequestDTO;
import com.example.tntt_Manager.dto.response.LeaderResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface LeaderService {

    Page<LeaderResponseDTO> getAllLeaders(Pageable pageable);

    Page<LeaderResponseDTO> searchLeaders(String keyword, Pageable pageable);

    LeaderResponseDTO createLeader(LeaderRequestDTO dto);

    LeaderResponseDTO updateLeader(UUID id, LeaderRequestDTO dto);

    void deleteLeader(UUID id);
}
