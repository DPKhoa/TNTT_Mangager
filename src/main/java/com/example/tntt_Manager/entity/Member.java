package com.example.tntt_Manager.entity;

import com.example.tntt_Manager.entity.enums.Gender;
import com.example.tntt_Manager.entity.enums.Branch;
import com.example.tntt_Manager.entity.enums.MemberOrigin;
import com.example.tntt_Manager.entity.enums.MemberStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Member {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "ho_va_ten", nullable = false)
    private String fullName;

    @Column(name = "ten_thanh")
    private String saintName;

    @Column(name = "ngay_sinh", nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "gioi_tinh", nullable = false)
    private Gender gender;

    @Column(name = "dia_chi")
    private String address;

    @Column(name = "so_dien_thoai", length = 15)
    private String phoneNumber;

    @Column(name = "email")
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "nganh", nullable = false)
    private Branch branch;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private MemberStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "nguon_goc")
    private MemberOrigin origin;

    @Column(name = "ngay_gia_nhap")
    private LocalDate enrollmentDate;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Guardian> guardians = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "createdat", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedat")
    private OffsetDateTime updatedAt;

    public void addGuardian(Guardian guardian) {
        guardians.add(guardian);
        guardian.setMember(this);
    }

    public void removeGuardian(Guardian guardian) {
        guardians.remove(guardian);
        guardian.setMember(null);
    }
}
