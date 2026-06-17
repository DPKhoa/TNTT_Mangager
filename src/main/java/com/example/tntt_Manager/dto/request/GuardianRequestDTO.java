package com.example.tntt_Manager.dto.request;

import com.example.tntt_Manager.entity.Guardian;
import com.example.tntt_Manager.entity.enums.RelationshipType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GuardianRequestDTO {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotNull(message = "Phone number is required")
    @Pattern(
        regexp = "^(0|\\+84)[0-9]{9}$",
        message = "Invalid phone number (e.g. 0912345678 or +84912345678)"
    )
    private String phoneNumber;

    @Email(message = "Invalid email format")
    private String email;

    @NotNull(message = "Relationship type is required")
    private RelationshipType relationship;

    public Guardian toEntity() {
        Guardian guardian = new Guardian();
        guardian.setFullName(this.fullName);
        guardian.setPhoneNumber(this.phoneNumber);
        guardian.setEmail(this.email);
        guardian.setRelationship(this.relationship);
        return guardian;
    }
}
