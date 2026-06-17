package com.example.tntt_Manager.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LeaderPosition {

    PARISH_CHIEF("PARISH_CHIEF"),
    PARISH_DEPUTY_EXTERNAL("PARISH_DEPUTY_EXTERNAL"),
    PARISH_DEPUTY_INTERNAL("PARISH_DEPUTY_INTERNAL"),
    SECRETARY("SECRETARY"),
    TREASURER("TREASURER"),
    SPECIALIST("SPECIALIST"),
    BRANCH_LEADER("BRANCH_LEADER"),
    BRANCH_DEPUTY("BRANCH_DEPUTY"),
    CLASS_LEADER("CLASS_LEADER"),
    ASSISTANT_SUPERVISOR("ASSISTANT_SUPERVISOR"),
    ASSISTANT_AIDE("ASSISTANT_AIDE"),
    GROUP_LEADER("GROUP_LEADER");

    private final String value;
}
