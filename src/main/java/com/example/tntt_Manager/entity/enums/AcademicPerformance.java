package com.example.tntt_Manager.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AcademicPerformance {

    EXCELLENT("EXCELLENT"),
    GOOD("GOOD"),
    AVERAGE("AVERAGE"),
    WEAK("WEAK");

    private final String value;
}
