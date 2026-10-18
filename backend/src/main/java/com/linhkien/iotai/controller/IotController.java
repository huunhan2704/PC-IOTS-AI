package com.linhkien.iotai.controller;

import com.linhkien.iotai.dto.ApiResponse;
import com.linhkien.iotai.dto.iot.IotDto;
import com.linhkien.iotai.security.UserPrincipal;
import com.linhkien.iotai.service.GeneralAppService;
import com.linhkien.iotai.service.InternalSimulatorService;
import com.linhkien.iotai.service.IotTelemetryService;
import com.linhkien.iotai.service.MqttSubscriberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/iot")
@RequiredArgsConstructor
public class IotController {

    private final IotTelemetryService telemetryService;
    private final GeneralAppService generalAppService;
    private final InternalSimulatorService simulatorService;
    private final MqttSubscriberService mqttSubscriberService;

    @GetMapping("/devices/my")
    public ResponseEntity<ApiResponse<List<IotDto.DeviceResponse>>> getMyDevices(@AuthenticationPrincipal UserPrincipal user) {
        String role = user.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(ApiResponse.ok(generalAppService.getUserDevices(user.getId(), role)));
    }

    @PostMapping("/devices")
    public ResponseEntity<ApiResponse<IotDto.DeviceResponse>> createDevice(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody IotDto.CreateDeviceRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Đăng ký thiết bị IoT thành công", generalAppService.createDevice(user.getId(), request)));
    }

    @GetMapping("/devices/{deviceCode}/telemetry")
    public ResponseEntity<ApiResponse<List<IotDto.TelemetryResponse>>> getTelemetryHistory(
            @PathVariable String deviceCode,
            @RequestParam(defaultValue = "60") int minutes) {
        return ResponseEntity.ok(ApiResponse.ok(telemetryService.getTelemetryHistory(deviceCode, minutes)));
    }

    @GetMapping("/devices/{deviceCode}/latest")
    public ResponseEntity<ApiResponse<IotDto.TelemetryResponse>> getLatestTelemetry(@PathVariable String deviceCode) {
        return ResponseEntity.ok(ApiResponse.ok(telemetryService.getLatestTelemetry(deviceCode)));
    }

    @GetMapping("/devices/{deviceCode}/alerts")
    public ResponseEntity<ApiResponse<List<IotDto.AlertResponse>>> getDeviceAlerts(@PathVariable String deviceCode) {
        return ResponseEntity.ok(ApiResponse.ok(telemetryService.getDeviceAlerts(deviceCode)));
    }

    @PostMapping("/simulate")
    public ResponseEntity<ApiResponse<IotDto.SimulateRequest>> simulateScenario(@RequestBody IotDto.SimulateRequest request) {
        simulatorService.setScenario(request.getDeviceCode(), request.getScenario());
        mqttSubscriberService.publishControlCommand(request.getDeviceCode(), request.getScenario());
        return ResponseEntity.ok(ApiResponse.ok("Chuyển kịch bản giả lập sang " + request.getScenario(), request));
    }
}
