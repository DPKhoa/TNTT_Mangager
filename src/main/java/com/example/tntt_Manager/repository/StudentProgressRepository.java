package com.example.tntt_Manager.repository;

import com.example.tntt_Manager.entity.StudentProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentProgressRepository extends JpaRepository<StudentProgress, UUID> {

    Optional<StudentProgress> findByStudentIdAndClassroomId(UUID studentId, UUID classroomId);
}
