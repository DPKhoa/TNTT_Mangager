package com.example.tntt_Manager.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RelationshipType {

    FATHER("FATHER"),
    MOTHER("MOTHER"),
    GRANDPARENT("GRANDPARENT"),
    OTHER_GUARDIAN("OTHER_GUARDIAN");

    private final String value;
}
