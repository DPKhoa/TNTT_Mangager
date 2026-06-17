package com.example.tntt_Manager.service.impl;

import com.example.tntt_Manager.dto.request.LeaderRequestDTO;
import com.example.tntt_Manager.dto.response.LeaderResponseDTO;
import com.example.tntt_Manager.entity.Leader;
import com.example.tntt_Manager.exception.ResourceNotFoundException;
import com.example.tntt_Manager.repository.LeaderRepository;
import com.example.tntt_Manager.service.LeaderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaderServiceImpl implements LeaderService {

    private final LeaderRepository leaderRepository;

    @Override
    public Page<LeaderResponseDTO> getAllLeaders(Pageable pageable) {
        return leaderRepository.findAll(pageable).map(LeaderResponseDTO::from);
    }

    @Override
    public Page<LeaderResponseDTO> searchLeaders(String keyword, Pageable pageable) {
        return leaderRepository.searchLeaders(keyword, pageable).map(LeaderResponseDTO::from);
    }

    @Override
    @Transactional
    public LeaderResponseDTO createLeader(LeaderRequestDTO dto) {
        return LeaderResponseDTO.from(leaderRepository.save(dto.toEntity()));
    }

    @Override
    @Transactional
    public LeaderResponseDTO updateLeader(UUID id, LeaderRequestDTO dto) {
        Leader leader = leaderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leader not found with id: " + id));

        leader.setLeaderCode(dto.getLeaderCode());
        leader.setChristianName(dto.getChristianName());
        leader.setFullName(dto.getFullName());
        leader.setDateOfBirth(dto.getDateOfBirth());
        leader.setGender(dto.getGender());
        leader.setPhoneNumber(dto.getPhoneNumber());
        leader.setEmail(dto.getEmail());
        leader.setLevel(dto.getLevel());
        leader.setStatus(dto.getStatus());
        leader.setPosition(dto.getPosition());

        return LeaderResponseDTO.from(leaderRepository.save(leader));
    }

    @Override
    @Transactional
    public void deleteLeader(UUID id) {
        if (!leaderRepository.existsById(id)) {
            throw new ResourceNotFoundException("Leader not found with id: " + id);
        }
        leaderRepository.deleteById(id);
    }
}
