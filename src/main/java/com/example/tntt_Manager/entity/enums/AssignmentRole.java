package com.example.tntt_Manager.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AssignmentRole {

    MAIN_TEACHER("MAIN_TEACHER"),
    ASSISTANT_TEACHER("ASSISTANT_TEACHER");

    private final String value;
}
