package com.example.tntt_Manager.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SystemRole {

    ADMIN("ADMIN"),
    EXECUTIVE_COMMITTEE("EXECUTIVE_COMMITTEE"),
    BRANCH_LEADER("BRANCH_LEADER"),
    CLASS_LEADER("CLASS_LEADER"),
    GROUP_LEADER("GROUP_LEADER"),
    JUNIOR_LEADER("JUNIOR_LEADER");

    private final String value;

    public String toSpringRole() {
        return "ROLE_" + value;
    }
}
