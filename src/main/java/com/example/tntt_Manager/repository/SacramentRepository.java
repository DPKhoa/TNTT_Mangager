package com.example.tntt_Manager.repository;

import com.example.tntt_Manager.entity.Sacrament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SacramentRepository extends JpaRepository<Sacrament, UUID> {

    List<Sacrament> findByStudentId(UUID studentId);
}
