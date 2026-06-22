package com.example.tntt_Manager.entity;

import com.example.tntt_Manager.entity.enums.Gender;
import com.example.tntt_Manager.entity.enums.LeaderLevel;
import com.example.tntt_Manager.entity.enums.LeaderPosition;
import com.example.tntt_Manager.entity.enums.LeaderStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "leader")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Leader {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "leader_code", unique = true)
    private String leaderCode;

    @Column(name = "christian_name")
    private String christianName;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)

    @Column(name = "gender", nullable = false)
    private Gender gender;

    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @Column(name = "email")
    private String email;

    @Enumerated(EnumType.STRING)

    @Column(name = "level", nullable = false)
    private LeaderLevel level;

    @Enumerated(EnumType.STRING)

    @Column(name = "status", nullable = false)
    private LeaderStatus status;

    @Enumerated(EnumType.STRING)

    @Column(name = "position", nullable = false)
    private LeaderPosition position;

    @CreationTimestamp
    @Column(name = "createdat", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedat")
    private OffsetDateTime updatedAt;
}
