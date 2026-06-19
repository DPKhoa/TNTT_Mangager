package com.example.tntt_Manager.repository;

import com.example.tntt_Manager.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, UUID> {

    // Spring Data điều hướng qua field `classroom` → lấy `id` của nó.
    // Tương đương SQL: WHERE lop_hoc_id = :classroomId
    List<AttendanceSession> findByClassroomId(UUID classroomId);
}
