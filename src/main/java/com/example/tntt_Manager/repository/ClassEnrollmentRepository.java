package com.example.tntt_Manager.repository;

import com.example.tntt_Manager.entity.ClassEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClassEnrollmentRepository extends JpaRepository<ClassEnrollment, UUID> {

    // Spring Data điều hướng qua field `member` rồi lấy `id` của nó.
    // Tương đương SQL: WHERE student_id = :memberId  (student_id là tên cột trong DB)
    List<ClassEnrollment> findByMemberId(UUID memberId);
}
