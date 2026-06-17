package com.example.tntt_Manager.repository;

import com.example.tntt_Manager.entity.Leader;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface LeaderRepository extends JpaRepository<Leader, UUID> {

    /**
     * Full-text search on full_name and christian_name columns using PostgreSQL's
     * unaccent extension — strips diacritics and normalises case before comparison.
     *
     * Prerequisites:
     *   CREATE EXTENSION IF NOT EXISTS unaccent;
     *   CREATE EXTENSION IF NOT EXISTS pg_trgm;
     *   CREATE INDEX idx_leader_name_search ON leader
     *     USING gin (unaccent(lower(full_name || ' ' || coalesce(christian_name, ''))) gin_trgm_ops);
     */
    @Query(
        value = """
            SELECT *
            FROM leader
            WHERE unaccent(lower(full_name || ' ' || coalesce(christian_name, '')))
                  LIKE unaccent(lower(concat('%', :keyword, '%')))
            """,
        countQuery = """
            SELECT count(*)
            FROM leader
            WHERE unaccent(lower(full_name || ' ' || coalesce(christian_name, '')))
                  LIKE unaccent(lower(concat('%', :keyword, '%')))
            """,
        nativeQuery = true
    )
    Page<Leader> searchLeaders(@Param("keyword") String keyword, Pageable pageable);
}
