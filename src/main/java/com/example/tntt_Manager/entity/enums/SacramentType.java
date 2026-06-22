package com.example.tntt_Manager.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SacramentType {

    BAPTISM("BAPTISM"),
    FIRST_COMMUNION("FIRST_COMMUNION"),
    CONFIRMATION("CONFIRMATION"),
    SOLEMN_COMMUNION("SOLEMN_COMMUNION");

    private final String value;
}
