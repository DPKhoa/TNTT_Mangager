package com.example.tntt_Manager.entity;

import com.example.tntt_Manager.entity.enums.AssignmentRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "phan_cong_lop")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassAssignment {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // Một huynh trưởng có thể được phân công vào nhiều lớp,
    // nhưng mỗi bản ghi phan_cong_lop chỉ thuộc về một huynh trưởng duy nhất.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "huynh_truong_id", nullable = false)
    private Leader leader;

    // Một lớp học có thể có nhiều huynh trưởng phụ trách (trưởng lớp + phụ tá),
    // nhưng mỗi bản ghi phan_cong_lop chỉ trỏ về một lớp duy nhất.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lop_hoc_id", nullable = false)
    private Classroom classroom;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "vai_tro", nullable = false)
    private AssignmentRole role;

    @Column(name = "ngay_phan_cong", nullable = false)
    private LocalDate assignmentDate;
}
