package com.example.tntt_Manager.entity;

import com.example.tntt_Manager.entity.enums.AttendanceStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "chi_tiet_diem_danh")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecord {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // Một buổi điểm danh có nhiều chi tiết (một dòng cho mỗi thiếu nhi),
    // mỗi chi tiết chỉ thuộc về một buổi điểm danh duy nhất.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buoi_diem_danh_id", nullable = false)
    private AttendanceSession session;

    // "Student" trong DB (thieu_nhi_id) ánh xạ sang entity Member trong Java.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thieu_nhi_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "trang_thai", nullable = false)
    private AttendanceStatus status;

    @Column(name = "ghi_chu_rieng")
    private String remarks;
}
