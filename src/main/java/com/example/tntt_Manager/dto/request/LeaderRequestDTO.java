package com.example.tntt_Manager.dto.request;

import com.example.tntt_Manager.entity.Leader;
import com.example.tntt_Manager.entity.enums.Gender;
import com.example.tntt_Manager.entity.enums.LeaderLevel;
import com.example.tntt_Manager.entity.enums.LeaderPosition;
import com.example.tntt_Manager.entity.enums.LeaderStatus;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class LeaderRequestDTO {

    @NotBlank(message = "Leader code is required")
    private String leaderCode;

    private String christianName;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @Pattern(
        regexp = "^(0|\\+84)[0-9]{9}$",
        message = "Invalid phone number (e.g. 0912345678 or +84912345678)"
    )
    private String phoneNumber;

    @Email(message = "Invalid email format")
    private String email;

    @NotNull(message = "Level is required")
    private LeaderLevel level;

    @NotNull(message = "Status is required")
    private LeaderStatus status;

    @NotNull(message = "Position is required")
    private LeaderPosition position;

    public Leader toEntity() {
        Leader leader = new Leader();
        leader.setLeaderCode(this.leaderCode);
        leader.setChristianName(this.christianName);
        leader.setFullName(this.fullName);
        leader.setDateOfBirth(this.dateOfBirth);
        leader.setGender(this.gender);
        leader.setPhoneNumber(this.phoneNumber);
        leader.setEmail(this.email);
        leader.setLevel(this.level);
        leader.setStatus(this.status);
        leader.setPosition(this.position);
        return leader;
    }
}
