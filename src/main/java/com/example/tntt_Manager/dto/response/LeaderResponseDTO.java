package com.example.tntt_Manager.dto.response;

import com.example.tntt_Manager.entity.Leader;
import com.example.tntt_Manager.entity.enums.Gender;
import com.example.tntt_Manager.entity.enums.LeaderLevel;
import com.example.tntt_Manager.entity.enums.LeaderPosition;
import com.example.tntt_Manager.entity.enums.LeaderStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class LeaderResponseDTO {

    private UUID id;
    private String leaderCode;
    private String christianName;
    private String fullName;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String phoneNumber;
    private String email;
    private LeaderLevel level;
    private LeaderStatus status;
    private LeaderPosition position;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static LeaderResponseDTO from(Leader leader) {
        return LeaderResponseDTO.builder()
                .id(leader.getId())
                .leaderCode(leader.getLeaderCode())
                .christianName(leader.getChristianName())
                .fullName(leader.getFullName())
                .dateOfBirth(leader.getDateOfBirth())
                .gender(leader.getGender())
                .phoneNumber(leader.getPhoneNumber())
                .email(leader.getEmail())
                .level(leader.getLevel())
                .status(leader.getStatus())
                .position(leader.getPosition())
                .createdAt(leader.getCreatedAt())
                .updatedAt(leader.getUpdatedAt())
                .build();
    }
}
