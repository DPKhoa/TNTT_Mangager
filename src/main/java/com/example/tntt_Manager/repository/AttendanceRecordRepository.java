package com.example.tntt_Manager.repository;

import com.example.tntt_Manager.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, UUID> {

    // Spring Data điều hướng qua field `session` → lấy `id` của nó.
    // Tương đương SQL: WHERE buoi_diem_danh_id = :sessionId
    // (Không thể đặt tên findByAttendanceSessionId vì field Java tên là `session`, không phải `attendanceSession`)
    List<AttendanceRecord> findBySessionId(UUID sessionId);

    // Dùng trong submitAttendance để xoá bản ghi cũ trước khi lưu lại toàn bộ
    void deleteBySessionId(UUID sessionId);
}
