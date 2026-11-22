package com.linhkien.iotai.controller;

import com.linhkien.iotai.dto.ApiResponse;
import com.linhkien.iotai.dto.iot.IotDto;
import com.linhkien.iotai.entity.IotDevice;
import com.linhkien.iotai.exception.ResourceNotFoundException;
import com.linhkien.iotai.repository.IotDeviceRepository;
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
    private final IotDeviceRepository deviceRepository;

    @GetMapping("/devices/my")
    public ResponseEntity<ApiResponse<List<IotDto.DeviceResponse>>> getMyDevices(@AuthenticationPrincipal UserPrincipal user) {
        if (user == null) {
            return ResponseEntity.ok(ApiResponse.ok(java.util.Collections.emptyList()));
        }
        String role = user.getAuthorities().iterator().next().getAuthority();
        return ResponseEntity.ok(ApiResponse.ok(generalAppService.getUserDevices(user.getId(), role)));
    }

    @PostMapping("/devices")
    public ResponseEntity<ApiResponse<IotDto.DeviceResponse>> createDevice(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody IotDto.CreateDeviceRequest request) {
        if (user == null) {
            throw new com.linhkien.iotai.exception.BadRequestException("Vui lòng đăng nhập");
        }
        String role = user.getAuthorities().iterator().next().getAuthority();
        if (!"ROLE_ADMIN".equals(role) && !"ROLE_TECHNICIAN".equals(role)) {
            throw new com.linhkien.iotai.exception.BadRequestException(
                    "Khách hàng không tự tạo Node thủ công. Hệ thống sẽ tự động cấp Node ESP32 đã cấu hình sẵn khi đơn hàng Build PC của bạn được xác nhận!");
        }
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

    @PostMapping("/telemetry")
    public ResponseEntity<ApiResponse<Void>> ingestTelemetryFromDesktop(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody IotDto.TelemetryResponse telemetry) {
        if (telemetry.getDeviceCode() == null || telemetry.getDeviceCode().isBlank()) {
            throw new IllegalArgumentException("deviceCode không được để trống");
        }
        String code = telemetry.getDeviceCode().trim().toUpperCase();
        IotDevice device = deviceRepository.findByDeviceCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Thiết bị không tồn tại: " + code));

        String role = user.getAuthorities().iterator().next().getAuthority();
        boolean isStaff = "ROLE_ADMIN".equals(role) || "ROLE_TECHNICIAN".equals(role);
        boolean isOwner = device.getUser() != null && device.getUser().getId().equals(user.getId());
        if (!isStaff && !isOwner) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền gửi dữ liệu cho mã thiết bị " + code);
        }

        // Nếu Desktop App chưa nhận trực tiếp gói MQTT từ ESP32 nhưng Backend đang nhận được tín hiệu ESP32 thật (trong 15s qua), ghép dữ liệu từ ESP32 thật vào
        boolean hasDesktopEsp = (telemetry.getAmbientTemp() != null && telemetry.getAmbientTemp() > 0)
                || (telemetry.getAmbientHumidity() != null && telemetry.getAmbientHumidity() > 0)
                || (telemetry.getDustDensity() != null && telemetry.getDustDensity() > 0);
        if (!hasDesktopEsp && mqttSubscriberService.isEsp32Connected(code)) {
            java.util.Map<String, Object> env = mqttSubscriberService.getLatestAmbientData(code);
            if (env != null) {
                if (env.get("ambientTemp") instanceof Number n) telemetry.setAmbientTemp(n.floatValue());
                else if (env.get("temperature") instanceof Number n) telemetry.setAmbientTemp(n.floatValue());
                if (env.get("ambientHumidity") instanceof Number n) telemetry.setAmbientHumidity(n.floatValue());
                else if (env.get("humidity") instanceof Number n) telemetry.setAmbientHumidity(n.floatValue());
                if (env.get("dustDensity") instanceof Number n) telemetry.setDustDensity(n.floatValue());
                else if (env.get("dust") instanceof Number n) telemetry.setDustDensity(n.floatValue());
            }
        }

        telemetryService.processTelemetry(code, telemetry);
        return ResponseEntity.ok(ApiResponse.ok("Đã nhận dữ liệu telemetry từ Desktop Agent", null));
    }
}
