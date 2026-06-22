package com.example.tntt_Manager.service.impl;

import com.example.tntt_Manager.dto.request.CreateUserRequestDTO;
import com.example.tntt_Manager.dto.response.UserResponseDTO;
import com.example.tntt_Manager.entity.Leader;
import com.example.tntt_Manager.entity.User;
import com.example.tntt_Manager.exception.ResourceNotFoundException;
import com.example.tntt_Manager.repository.LeaderRepository;
import com.example.tntt_Manager.repository.UserRepository;
import com.example.tntt_Manager.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final LeaderRepository leaderRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserResponseDTO createUser(CreateUserRequestDTO dto) {
        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already exists: " + dto.getUsername());
        }

        Leader leader = null;
        if (dto.getLeaderId() != null) {
            leader = leaderRepository.findById(dto.getLeaderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Leader not found with id: " + dto.getLeaderId()));
        }

        User user = User.builder()
                .username(dto.getUsername())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .role(dto.getRole())
                .leader(leader)
                .build();

        return UserResponseDTO.from(userRepository.save(user));
    }
}
