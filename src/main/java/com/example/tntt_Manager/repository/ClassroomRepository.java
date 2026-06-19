package com.example.tntt_Manager.repository;

import com.example.tntt_Manager.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, UUID> {

    // Spring Data tự dịch tên phương thức thành: WHERE nam_hoc = :academicYear
    List<Classroom> findByAcademicYear(String academicYear);
}
