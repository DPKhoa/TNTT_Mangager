package com.example.tntt_Manager.entity;

import com.example.tntt_Manager.entity.enums.SacramentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "bi_tich")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sacrament {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thieu_nhi_id", nullable = false)
    private Member student;

    @Enumerated(EnumType.STRING)

    @Column(name = "loai_bi_tich", nullable = false)
    private SacramentType sacramentType;

    @Column(name = "ngay_nhan", nullable = false)
    private LocalDate receivedDate;

    @Column(name = "ten_thanh_bo_mang_nguoi_lam_chung")
    private String patronSaint;

    @Column(name = "linh_muc_ban")
    private String celebrant;

    @Column(name = "noi_nhan")
    private String place;

    @CreationTimestamp
    @Column(name = "createdat", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedat")
    private OffsetDateTime updatedAt;
}
