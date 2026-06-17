package com.example.tntt_Manager.service.impl;

import com.example.tntt_Manager.dto.request.GuardianRequestDTO;
import com.example.tntt_Manager.dto.request.MemberRequestDTO;
import com.example.tntt_Manager.dto.response.GuardianResponseDTO;
import com.example.tntt_Manager.dto.response.MemberResponseDTO;
import com.example.tntt_Manager.entity.Member;
import com.example.tntt_Manager.entity.enums.MemberOrigin;
import com.example.tntt_Manager.entity.enums.MemberStatus;
import com.example.tntt_Manager.exception.ResourceNotFoundException;
import com.example.tntt_Manager.repository.MemberRepository;
import com.example.tntt_Manager.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;

    @Override
    public Page<MemberResponseDTO> getMembersByStatus(MemberStatus status, Pageable pageable) {
        Page<Member> page = memberRepository.findByStatus(status, pageable);
        return page.map(member -> MemberResponseDTO.from(member));
    }

    @Override
    public Page<MemberResponseDTO> searchMembers(String keyword, Pageable pageable) {
        Page<Member> page = memberRepository.searchByName(keyword, pageable);
        return page.map(member -> MemberResponseDTO.from(member));
    }

    @Override
    @Transactional
    public MemberResponseDTO createMember(MemberRequestDTO dto) {
        Member member = dto.toEntity();
        member.setStatus(MemberStatus.ACTIVE);
        member.setOrigin(dto.getOrigin() != null ? dto.getOrigin() : MemberOrigin.NEW_MEMBER);
        return MemberResponseDTO.from(memberRepository.save(member));
    }

    @Override
    @Transactional
    public MemberResponseDTO updateMember(UUID id, MemberRequestDTO dto) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with id: " + id));

        member.setFullName(dto.getFullName());
        member.setSaintName(dto.getSaintName());
        member.setDateOfBirth(dto.getDateOfBirth());
        member.setGender(dto.getGender());
        member.setAddress(dto.getAddress());
        member.setPhoneNumber(dto.getPhoneNumber());
        member.setEmail(dto.getEmail());
        member.setBranch(dto.getBranch());
        member.setEnrollmentDate(dto.getEnrollmentDate());
        member.setNotes(dto.getNotes());

        return MemberResponseDTO.from(memberRepository.save(member));
    }

    @Override
    @Transactional
    public void deleteMember(UUID id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with id: " + id));

        member.getGuardians().clear(); // initialize LAZY collection so orphanRemoval deletes each guardian
        memberRepository.delete(member);
    }

    @Override
    @Transactional
    public GuardianResponseDTO addGuardianToMember(UUID memberId, GuardianRequestDTO dto) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Member not found with id: " + memberId));

        var guardian = dto.toEntity();
        member.addGuardian(guardian);
        memberRepository.save(member);

        return GuardianResponseDTO.from(guardian);
    }
}
