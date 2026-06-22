package com.example.tntt_Manager.dto.response;

import com.example.tntt_Manager.entity.User;
import com.example.tntt_Manager.entity.enums.SystemRole;
import lombok.Getter;

import java.util.UUID;

@Getter
public class UserResponseDTO {

    private final UUID id;
    private final String username;
    private final SystemRole role;
    private final UUID leaderId;
    private final String leaderFullName;

    private UserResponseDTO(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.role = user.getRole();
        this.leaderId = user.getLeader() != null ? user.getLeader().getId() : null;
        this.leaderFullName = user.getLeader() != null ? user.getLeader().getFullName() : null;
    }

    public static UserResponseDTO from(User user) {
        return new UserResponseDTO(user);
    }
}
