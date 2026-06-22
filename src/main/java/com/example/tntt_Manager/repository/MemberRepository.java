package com.example.tntt_Manager.repository;

import com.example.tntt_Manager.entity.Member;
import com.example.tntt_Manager.entity.enums.MemberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MemberRepository extends JpaRepository<Member, UUID> {

    @Query(value = """
            SELECT *
            FROM members
            WHERE unaccent(lower(ho_va_ten || ' ' || coalesce(ten_thanh, '')))
                  LIKE unaccent(lower(concat('%', :keyword, '%')))
            """, countQuery = """
            SELECT count(*)
            FROM members
            WHERE unaccent(lower(ho_va_ten || ' ' || coalesce(ten_thanh, '')))
                  LIKE unaccent(lower(concat('%', :keyword, '%')))
            """, nativeQuery = true)
    Page<Member> searchByName(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Fetches members by status and eagerly loads the guardians collection in a
     * single JOIN query.
     *
     * Without @EntityGraph, accessing member.getGuardians() inside the service
     * would trigger
     * one extra SELECT per member (N+1 problem). This annotation tells Hibernate to
     * use
     * LEFT JOIN FETCH on the guardians relationship, loading everything in one
     * round-trip to the DB.
     */
    @EntityGraph(attributePaths = "guardians")
    Page<Member> findByStatus(MemberStatus status, Pageable pageable);

    long countByStatus(MemberStatus status);

    @Query("SELECT m.branch, COUNT(m) FROM Member m WHERE m.status = :status GROUP BY m.branch")
    List<Object[]> countByBranchAndStatus(@Param("status") MemberStatus status);
}
