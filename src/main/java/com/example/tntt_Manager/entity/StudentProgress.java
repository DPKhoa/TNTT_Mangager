package com.example.tntt_Manager.entity;

import com.example.tntt_Manager.entity.enums.AcademicPerformance;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ket_qua_hoc_tap")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProgress {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thieu_nhi_id", nullable = false)
    private Member student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lop_hoc_id", nullable = false)
    private Classroom classroom;

    @Column(name = "diem_giao_ly", precision = 5, scale = 2)
    private BigDecimal catechismScore;

    @Column(name = "diem_chuyen_can", precision = 5, scale = 2)
    private BigDecimal attendanceScore;

    @Enumerated(EnumType.STRING)

    @Column(name = "hoc_luc")
    private AcademicPerformance performance;

    @Column(name = "is_len_lop")
    private boolean promoted;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String remarks;

    @CreationTimestamp
    @Column(name = "createdat", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedat")
    private OffsetDateTime updatedAt;
}
