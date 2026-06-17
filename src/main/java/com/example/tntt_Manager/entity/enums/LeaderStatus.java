package com.example.tntt_Manager.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LeaderStatus {

    ACTIVE("ACTIVE"),
    ON_LEAVE("ON_LEAVE"),
    INACTIVE("INACTIVE");

    private final String value;
}
