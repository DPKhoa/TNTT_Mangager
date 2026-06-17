package com.example.tntt_Manager.dto.request;

import com.example.tntt_Manager.entity.Member;
import com.example.tntt_Manager.entity.enums.Branch;
import com.example.tntt_Manager.entity.enums.Gender;
import com.example.tntt_Manager.entity.enums.MemberOrigin;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class MemberRequestDTO {

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private String saintName;

    @NotNull(message = "Ngày sinh không được để trống")
    @Past(message = "Ngày sinh phải là ngày trong quá khứ")
    private LocalDate dateOfBirth;

    @NotNull(message = "Giới tính không được để trống")
    private Gender gender;

    private String address;

    @Pattern(
        regexp = "^(0|\\+84)[0-9]{9}$",
        message = "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)"
    )
    private String phoneNumber;

    @Email(message = "Email không hợp lệ")
    private String email;

    @NotNull(message = "Ngành không được để trống")
    private Branch branch;

    private MemberOrigin origin;

    @PastOrPresent(message = "Ngày gia nhập không được là ngày trong tương lai")
    private LocalDate enrollmentDate;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String notes;

    public Member toEntity() {
        Member member = new Member();
        member.setFullName(this.fullName);
        member.setSaintName(this.saintName);
        member.setDateOfBirth(this.dateOfBirth);
        member.setGender(this.gender);
        member.setAddress(this.address);
        member.setPhoneNumber(this.phoneNumber);
        member.setEmail(this.email);
        member.setBranch(this.branch);
        member.setEnrollmentDate(this.enrollmentDate);
        member.setNotes(this.notes);
        return member;
    }
}
