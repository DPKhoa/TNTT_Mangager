package com.example.tntt_Manager.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MemberStatus {

    ACTIVE("ACTIVE"),
    ON_LEAVE("ON_LEAVE"),
    INACTIVE("INACTIVE"),
    GRADUATED("GRADUATED");

    private final String value;
}
