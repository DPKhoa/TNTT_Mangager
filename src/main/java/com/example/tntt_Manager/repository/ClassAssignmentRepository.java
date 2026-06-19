package com.example.tntt_Manager.repository;

import com.example.tntt_Manager.entity.ClassAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClassAssignmentRepository extends JpaRepository<ClassAssignment, UUID> {

    // Spring Data điều hướng qua field `leader` rồi lấy `id` của nó.
    // Tương đương SQL: WHERE huynh_truong_id = :leaderId
    List<ClassAssignment> findByLeaderId(UUID leaderId);
}
