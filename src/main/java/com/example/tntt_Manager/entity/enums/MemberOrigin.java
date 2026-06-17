package com.example.tntt_Manager.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MemberOrigin {

    NEW_MEMBER("NEW_MEMBER"),
    TRANSFERRED("TRANSFERRED"),
    RETURNING("RETURNING");

    private final String value;
}
