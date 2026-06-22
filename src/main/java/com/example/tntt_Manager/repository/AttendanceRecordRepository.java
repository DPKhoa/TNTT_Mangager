package com.example.tntt_Manager.repository;

import com.example.tntt_Manager.entity.AttendanceRecord;
import com.example.tntt_Manager.entity.enums.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, UUID> {

    List<AttendanceRecord> findBySessionId(UUID sessionId);

    void deleteBySessionId(UUID sessionId);

    // ── Dashboard queries ────────────────────────────────────────────────────

    @Query("SELECT COUNT(r) FROM AttendanceRecord r " +
           "WHERE r.session.sessionDate BETWEEN :start AND :end " +
           "AND r.status = :status")
    long countBySessionDateBetweenAndStatus(
            @Param("start") LocalDate start,
            @Param("end")   LocalDate end,
            @Param("status") AttendanceStatus status
    );

    @Query("SELECT COUNT(r) FROM AttendanceRecord r " +
           "WHERE r.session.sessionDate BETWEEN :start AND :end")
    long countBySessionDateBetween(
            @Param("start") LocalDate start,
            @Param("end")   LocalDate end
    );

    // Eagerly loads session + classroom to avoid N+1 when aggregating by class
    @Query("SELECT r FROM AttendanceRecord r " +
           "JOIN FETCH r.session s " +
           "JOIN FETCH s.classroom c " +
           "WHERE s.sessionDate BETWEEN :start AND :end")
    List<AttendanceRecord> findWithClassroomByDateRange(
            @Param("start") LocalDate start,
            @Param("end")   LocalDate end
    );
}
