package com.example.tntt_Manager.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Branch {

    SOLDIER("SOLDIER"),
    INFANT("INFANT"),
    JUNIOR("JUNIOR"),
    SENIOR("SENIOR"),
    ADVENTURER("ADVENTURER"),
    JUNIOR_LEADER("JUNIOR_LEADER");

    private final String value;
}
