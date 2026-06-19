package com.example.tntt_Manager.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AttendanceStatus {

    PRESENT("PRESENT"),
    EXCUSED_ABSENCE("EXCUSED_ABSENCE"),
    UNEXCUSED_ABSENCE("UNEXCUSED_ABSENCE");

    private final String value;
}
