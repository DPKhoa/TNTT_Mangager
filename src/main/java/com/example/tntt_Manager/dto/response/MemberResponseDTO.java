package com.example.tntt_Manager.dto.response;

import com.example.tntt_Manager.entity.Member;
import com.example.tntt_Manager.entity.enums.Branch;
import com.example.tntt_Manager.entity.enums.Gender;
import com.example.tntt_Manager.entity.enums.MemberOrigin;
import com.example.tntt_Manager.entity.enums.MemberStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class MemberResponseDTO {

    private UUID id;
    private String fullName;
    private String saintName;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String address;
    private String phoneNumber;
    private String email;
    private Branch branch;
    private MemberStatus status;
    private MemberOrigin origin;
    private LocalDate enrollmentDate;
    private String notes;
    private List<GuardianResponseDTO> guardians;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static MemberResponseDTO from(Member member) {
        return MemberResponseDTO.builder()
                .id(member.getId())
                .fullName(member.getFullName())
                .saintName(member.getSaintName())
                .dateOfBirth(member.getDateOfBirth())
                .gender(member.getGender())
                .address(member.getAddress())
                .phoneNumber(member.getPhoneNumber())
                .email(member.getEmail())
                .branch(member.getBranch())
                .status(member.getStatus())
                .origin(member.getOrigin())
                .enrollmentDate(member.getEnrollmentDate())
                .notes(member.getNotes())
                .guardians(member.getGuardians().stream()
                        .map(GuardianResponseDTO::from)
                        .toList())
                .createdAt(member.getCreatedAt())
                .updatedAt(member.getUpdatedAt())
                .build();
    }
}
