package com.example.tntt_Manager.dto.response;

import com.example.tntt_Manager.entity.Sacrament;
import com.example.tntt_Manager.entity.enums.SacramentType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class SacramentResponseDTO {

    private UUID id;
    private SacramentType sacramentType;
    private LocalDate receivedDate;
    private String patronSaint;
    private String celebrant;
    private String place;
    private OffsetDateTime createdAt;

    public static SacramentResponseDTO from(Sacrament sacrament) {
        return SacramentResponseDTO.builder()
                .id(sacrament.getId())
                .sacramentType(sacrament.getSacramentType())
                .receivedDate(sacrament.getReceivedDate())
                .patronSaint(sacrament.getPatronSaint())
                .celebrant(sacrament.getCelebrant())
                .place(sacrament.getPlace())
                .createdAt(sacrament.getCreatedAt())
                .build();
    }
}
