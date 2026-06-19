package com.example.tntt_Manager.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "buoi_diem_danh")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceSession {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "ngay_diem_danh", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "ghi_chu")
    private String description;

    // Một lớp học có nhiều buổi điểm danh,
    // mỗi buổi điểm danh chỉ thuộc về một lớp duy nhất.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lop_hoc_id", nullable = false)
    private Classroom classroom;

    @CreationTimestamp
    @Column(name = "createdat", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedat")
    private OffsetDateTime updatedAt;
}
