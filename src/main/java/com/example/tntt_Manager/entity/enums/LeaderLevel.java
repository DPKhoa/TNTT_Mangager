package com.example.tntt_Manager.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LeaderLevel {

    PROBATIONARY_LEADER("PROBATIONARY_LEADER"),
    CERTIFIED_LEADER("CERTIFIED_LEADER");

    private final String value;
}
