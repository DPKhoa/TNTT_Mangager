package com.example.tntt_Manager.dto.response;

import com.example.tntt_Manager.entity.Guardian;
import com.example.tntt_Manager.entity.enums.RelationshipType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class GuardianResponseDTO {

    private UUID id;
    private String fullName;
    private String phoneNumber;
    private String email;
    private RelationshipType relationship;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GuardianResponseDTO from(Guardian guardian) {
        return GuardianResponseDTO.builder()
                .id(guardian.getId())
                .fullName(guardian.getFullName())
                .phoneNumber(guardian.getPhoneNumber())
                .email(guardian.getEmail())
                .relationship(guardian.getRelationship())
                .createdAt(guardian.getCreatedAt())
                .updatedAt(guardian.getUpdatedAt())
                .build();
    }
}
