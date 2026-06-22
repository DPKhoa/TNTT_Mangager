package com.example.tntt_Manager.entity;

import com.example.tntt_Manager.entity.enums.SystemRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "username", unique = true, nullable = false)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)

    @Column(name = "role", nullable = false)
    private SystemRole role;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "huynh_truong_id")
    private Leader leader;
}
