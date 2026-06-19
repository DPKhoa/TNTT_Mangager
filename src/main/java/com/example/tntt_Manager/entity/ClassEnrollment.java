package com.example.tntt_Manager.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "phan_lop")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassEnrollment {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // Một thiếu nhi (Member) có thể được phân vào nhiều lớp qua các năm,
    // nhưng mỗi bản ghi phan_lop chỉ thuộc về một thiếu nhi duy nhất.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Member member;

    // Một lớp học có thể chứa nhiều thiếu nhi,
    // nhưng mỗi bản ghi phan_lop chỉ trỏ về một lớp duy nhất.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lop_hoc_id", nullable = false)
    private Classroom classroom;

    @Column(name = "ngay_phan_lop", nullable = false)
    private LocalDate enrollmentDate;
}
