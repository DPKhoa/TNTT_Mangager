package com.example.tntt_Manager.dto.request;

import com.example.tntt_Manager.entity.enums.SacramentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class SacramentRequestDTO {

    @NotNull(message = "Student ID must not be null")
    private UUID studentId;

    @NotNull(message = "Sacrament type must not be null")
    private SacramentType sacramentType;

    @NotNull(message = "Received date must not be null")
    @PastOrPresent(message = "Received date must not be a future date")
    private LocalDate receivedDate;

    @Size(max = 100, message = "Patron saint name must not exceed 100 characters")
    private String patronSaint;

    @Size(max = 100, message = "Celebrant name must not exceed 100 characters")
    private String celebrant;

    @Size(max = 200, message = "Place must not exceed 200 characters")
    private String place;
}
