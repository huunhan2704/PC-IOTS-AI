package com.linhkien.iotai.controller;

import com.linhkien.iotai.dto.ApiResponse;
import com.linhkien.iotai.dto.ai.AiDto;
import com.linhkien.iotai.service.AIDiagnosticService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AIDiagnosticService aiDiagnosticService;

    @GetMapping("/diagnostics/{deviceCode}")
    public ResponseEntity<ApiResponse<AiDto.DiagnosticReport>> getDiagnostics(@PathVariable String deviceCode) {
        return ResponseEntity.ok(ApiResponse.ok(aiDiagnosticService.getLatestDiagnostic(deviceCode)));
    }

    @PostMapping("/diagnostics/{deviceCode}/run")
    public ResponseEntity<ApiResponse<AiDto.DiagnosticReport>> runDiagnostics(@PathVariable String deviceCode) {
        return ResponseEntity.ok(ApiResponse.ok("Chuẩn đoán hệ thống hoàn tất", aiDiagnosticService.runDiagnostic(deviceCode)));
    }

    @PostMapping("/diagnostics/{deviceCode}/simulate")
    public ResponseEntity<ApiResponse<AiDto.DiagnosticReport>> simulateBottleneck(
            @PathVariable String deviceCode,
            @RequestParam(required = false, defaultValue = "ALL") String scenario) {
        return ResponseEntity.ok(ApiResponse.ok("Đã nạp chuỗi telemetry mô phỏng nghẽn và hoàn tất phân tích", aiDiagnosticService.simulateBottleneck(deviceCode, scenario)));
    }

    @PostMapping("/recommendations/{id}/viewed")
    public ResponseEntity<ApiResponse<Void>> markViewed(@PathVariable Long id) {
        aiDiagnosticService.markViewed(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã ghi nhận xem khuyến nghị", null));
    }

    @PostMapping("/recommendations/{id}/apply")
    public ResponseEntity<ApiResponse<Void>> markApplied(@PathVariable Long id) {
        aiDiagnosticService.markApplied(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã áp dụng gói khuyến nghị nâng cấp", null));
    }
}
