package com.example.tntt_Manager.controller;

import com.example.tntt_Manager.dto.response.DashboardStatsResponseDTO;
import com.example.tntt_Manager.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponseDTO> getStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }
}
