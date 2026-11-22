package com.linhkien.iotai.service;

import com.linhkien.iotai.dto.ai.AiDto;
import com.linhkien.iotai.entity.AiRecommendation;
import com.linhkien.iotai.entity.IotDevice;
import com.linhkien.iotai.entity.Product;
import com.linhkien.iotai.entity.TelemetryLog;
import com.linhkien.iotai.entity.enums.Severity;
import com.linhkien.iotai.exception.ResourceNotFoundException;
import com.linhkien.iotai.repository.AiRecommendationRepository;
import com.linhkien.iotai.repository.IotDeviceRepository;
import com.linhkien.iotai.repository.ProductRepository;
import com.linhkien.iotai.repository.TelemetryLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIDiagnosticService {

    private final IotDeviceRepository deviceRepository;
    private final TelemetryLogRepository telemetryLogRepository;
    private final AiRecommendationRepository recommendationRepository;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Transactional
    public AiDto.DiagnosticReport runDiagnostic(String deviceCode) {
        IotDevice device = deviceRepository.findByDeviceCode(deviceCode)
                .orElseThrow(() -> new ResourceNotFoundException("Thiết bị không tồn tại: " + deviceCode));

        if (device.getStatus() != com.linhkien.iotai.entity.enums.DeviceStatus.ONLINE
                && device.getStatus() != com.linhkien.iotai.entity.enums.DeviceStatus.WARNING) {
            throw new com.linhkien.iotai.exception.BadRequestException(
                    "Thiết bị " + deviceCode + " đang OFFLINE (chưa kết nối PC). Vui lòng mở ứng dụng Desktop Agent kết nối máy tính lên trạng thái ONLINE trước khi Đo Đạc Thật!");
        }

        // Xóa toàn bộ dữ liệu mô phỏng (SIMULATED) trước khi đo đạc thật để không bị lẫn số giả
        telemetryLogRepository.deleteSimulatedByDeviceId(device.getId());

        return analyzeDeviceLogs(device);
    }

    private AiDto.DiagnosticReport analyzeDeviceLogs(IotDevice device) {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<TelemetryLog> allLogs = telemetryLogRepository.findByDeviceIdAndRecordedAtAfter(device.getId(), since);

        if (allLogs.isEmpty()) {
            return buildEmptyReport(device);
        }

        // Phân tích tối đa 100 mẫu đo gần nhất để phản ánh sát trạng thái phần cứng hiện tại
        List<TelemetryLog> logs = allLogs.size() > 100 ? allLogs.subList(0, 100) : allLogs;
        int totalSamples = logs.size();

        // 1. Calculate Statistics & Metrics
        double sumCpuLoad = 0, sumGpuLoad = 0, sumRamUsage = 0, sumCpuTemp = 0;
        float maxCpuTemp = 0, maxGpuTemp = 0;
        int peakPowerW = 0, maxFanRpm = 0;
        int ramOver88Count = 0;
        int cpuOver95GpuUnder40Count = 0;
        int overheatCount = 0;

        List<Float> cpuLoads = new ArrayList<>();

        for (TelemetryLog l : logs) {
            sumCpuLoad += l.getCpuLoad();
            sumGpuLoad += l.getGpuLoad();
            sumRamUsage += l.getRamUsage();
            sumCpuTemp += l.getCpuTemp();

            if (l.getCpuTemp() > maxCpuTemp) maxCpuTemp = l.getCpuTemp();
            if (l.getGpuTemp() > maxGpuTemp) maxGpuTemp = l.getGpuTemp();
            if (l.getPowerDrawW() > peakPowerW) peakPowerW = l.getPowerDrawW();
            if (l.getFanSpeedRpm() > maxFanRpm) maxFanRpm = l.getFanSpeedRpm();

            if (l.getRamUsage() > 88.0f) ramOver88Count++;
            if (l.getCpuLoad() > 95.0f && l.getGpuLoad() < 40.0f) cpuOver95GpuUnder40Count++;
            if (l.getCpuTemp() >= 85.0f || l.getGpuTemp() >= 85.0f) overheatCount++;

            cpuLoads.add(l.getCpuLoad());
        }

        Collections.sort(cpuLoads);
        int p95Index = (int) Math.ceil(0.95 * cpuLoads.size()) - 1;
        float p95Cpu = cpuLoads.get(Math.max(0, p95Index));

        float avgCpu = (float) (sumCpuLoad / totalSamples);
        float avgGpu = (float) (sumGpuLoad / totalSamples);
        float avgRam = (float) (sumRamUsage / totalSamples);
        float avgCpuTemp = (float) (sumCpuTemp / totalSamples);

        float ramOver88Ratio = (float) ramOver88Count / totalSamples;
        float overheatRatio = (float) overheatCount / totalSamples;

        int psuWatt = 650;
        if (device.getCurrentPsu() != null && device.getCurrentPsu().getSpecs() != null && device.getCurrentPsu().getSpecs().getPsuWattage() != null) {
            psuWatt = device.getCurrentPsu().getSpecs().getPsuWattage();
        }
        float psuLoadRatio = (float) peakPowerW / psuWatt;

        AiDto.DiagnosticMetrics metrics = AiDto.DiagnosticMetrics.builder()
                .avgCpuLoad(round1(avgCpu))
                .p95CpuLoad(round1(p95Cpu))
                .avgGpuLoad(round1(avgGpu))
                .avgRamUsage(round1(avgRam))
                .ramOver88Ratio(round2(ramOver88Ratio))
                .maxCpuTemp(round1(maxCpuTemp))
                .maxGpuTemp(round1(maxGpuTemp))
                .avgCpuTemp(round1(avgCpuTemp))
                .overheatRatio(round2(overheatRatio))
                .peakPowerW(peakPowerW)
                .psuWattage(psuWatt)
                .psuLoadRatio(round2(psuLoadRatio))
                .maxFanRpm(maxFanRpm)
                .build();

        // 2. Clear old recommendations for fresh run
        recommendationRepository.deleteByDeviceId(device.getId());

        List<AiDto.FindingItem> findings = new ArrayList<>();
        List<AiRecommendation> newRecs = new ArrayList<>();
        int healthScore = 100;

        // BR11: RAM Bottleneck (Frequency of RAM > 88% exceeds 30% of runtime)
        if (ramOver88Ratio >= 0.30f || avgRam > 80.0f) {
            healthScore -= 20;
            findings.add(AiDto.FindingItem.builder()
                    .bottleneckType("RAM_EXHAUSTION")
                    .severity("HIGH")
                    .diagnosticText(String.format("Nghẽn bộ nhớ RAM (BR11): Tần suất RAM Usage > 88%% đạt %.1f%% thời gian vận hành. Hệ thống thường xuyên phải sử dụng bộ nhớ ảo (Pagefile), gây giật lag (stuttering) nghiêm trọng.", ramOver88Ratio * 100.0f))
                    .build());

            // Suggest RAM 32GB
            List<Product> ramList = productRepository.findByCategorySlug("ram");
            Product suggestedRam = ramList.stream()
                    .filter(r -> r.getSpecs() != null && r.getSpecs().getCapacityGb() != null && r.getSpecs().getCapacityGb() >= 32)
                    .findFirst()
                    .orElse(!ramList.isEmpty() ? ramList.get(0) : null);

            if (suggestedRam != null) {
                newRecs.add(AiRecommendation.builder()
                        .device(device)
                        .user(device.getUser())
                        .bottleneckType("RAM_EXHAUSTION")
                        .severity(Severity.HIGH)
                        .diagnosticText("Nâng cấp RAM từ 16GB lên kit 32GB Dual Channel để chấm dứt tình trạng tràn RAM khi đa nhiệm.")
                        .currentProduct(device.getCurrentRam())
                        .recommendedProduct(suggestedRam)
                        .expectedPerformanceGain("+35% tốc độ tải ứng dụng và độ mượt khi đa nhiệm/chơi game nặng")
                        .build());
            }
        }

        // BR12: CPU Bottleneck (CPU Load > 95% while GPU Load < 40%)
        if (cpuOver95GpuUnder40Count > 5 || (avgCpu > 85.0f && avgGpu < 45.0f)) {
            healthScore -= 25;
            findings.add(AiDto.FindingItem.builder()
                    .bottleneckType("CPU_BOTTLENECK")
                    .severity("HIGH")
                    .diagnosticText("Nghẽn cổ chai CPU (BR12): CPU thường xuyên chạm tải 95% - 100% trong khi Card đồ họa GPU nhàn rỗi (< 40%). CPU không đủ băng thông để cung cấp dữ liệu cho GPU.")
                    .build());

            List<Product> cpuList = productRepository.findByCategorySlug("cpu");
            Product suggestedCpu = cpuList.stream()
                    .filter(c -> c.getSpecs() != null && c.getSpecs().getCores() != null && c.getSpecs().getCores() >= 14)
                    .findFirst()
                    .orElse(!cpuList.isEmpty() ? cpuList.get(0) : null);

            if (suggestedCpu != null) {
                newRecs.add(AiRecommendation.builder()
                        .device(device)
                        .user(device.getUser())
                        .bottleneckType("CPU_BOTTLENECK")
                        .severity(Severity.HIGH)
                        .diagnosticText("Nâng cấp vi xử lý lên dòng nhiều nhân/luồng hơn để giải phóng toàn bộ sức mạnh của Card đồ họa.")
                        .currentProduct(device.getCurrentCpu())
                        .recommendedProduct(suggestedCpu)
                        .expectedPerformanceGain("+40% FPS ổn định, giảm tối đa hiện tượng 1% low FPS trong game")
                        .build());
            }
        }

        // BR13: Thermal Throttling (CPU/GPU >= 85°C kèm sụt xung nhịp)
        if (maxCpuTemp >= 85.0f || overheatRatio > 0.05f) {
            healthScore -= 30;
            findings.add(AiDto.FindingItem.builder()
                    .bottleneckType("THERMAL_THROTTLING")
                    .severity("CRITICAL")
                    .diagnosticText(String.format("Quá nhiệt & Sụt xung nhịp (BR13): Nhiệt độ CPU đạt đỉnh %.1f°C (ngưỡng an toàn < 80°C). Cơ chế Thermal Throttling tự động hạ xung nhịp để bảo vệ chip, gây sụt giảm hiệu năng tức thời.", maxCpuTemp))
                    .build());

            // Suggest AIO 240mm or 360mm
            List<Product> coolers = productRepository.findByCategorySlug("cooler");
            Product suggestedCooler = coolers.stream()
                    .filter(c -> c.getSpecs() != null && "AIO Liquid".equalsIgnoreCase(c.getSpecs().getCoolingType()))
                    .findFirst()
                    .orElse(!coolers.isEmpty() ? coolers.get(0) : null);

            if (suggestedCooler != null) {
                newRecs.add(AiRecommendation.builder()
                        .device(device)
                        .user(device.getUser())
                        .bottleneckType("THERMAL_THROTTLING")
                        .severity(Severity.CRITICAL)
                        .diagnosticText("Trang bị bộ tản nhiệt nước All-In-One (AIO 240mm/360mm) với khả năng giải nhiệt cao vượt trội so với tản khí thông thường.")
                        .currentProduct(device.getCurrentCooler())
                        .recommendedProduct(suggestedCooler)
                        .expectedPerformanceGain("Giảm ngay 15°C - 20°C nhiệt độ CPU, duy trì xung boost tối đa liên tục")
                        .build());
            }
        }

        // PSU Overload Risk: peak power > 80% PSU wattage
        if (psuLoadRatio > 0.80f) {
            healthScore -= 15;
            findings.add(AiDto.FindingItem.builder()
                    .bottleneckType("PSU_INSUFFICIENT")
                    .severity("HIGH")
                    .diagnosticText(String.format("Nguy cơ quá tải nguồn máy tính (PSU): Công suất đỉnh tiêu thụ (%dW) chiếm %.1f%% công suất định danh của bộ nguồn (%dW). Vượt quá ngưỡng an toàn 80%%.", peakPowerW, psuLoadRatio * 100.0f, psuWatt))
                    .build());

            List<Product> psus = productRepository.findByCategorySlug("psu");
            Product suggestedPsu = psus.stream()
                    .filter(p -> p.getSpecs() != null && p.getSpecs().getPsuWattage() != null && p.getSpecs().getPsuWattage() >= 750)
                    .findFirst()
                    .orElse(!psus.isEmpty() ? psus.get(0) : null);

            if (suggestedPsu != null) {
                newRecs.add(AiRecommendation.builder()
                        .device(device)
                        .user(device.getUser())
                        .bottleneckType("PSU_INSUFFICIENT")
                        .severity(Severity.HIGH)
                        .diagnosticText("Nâng cấp nguồn lên chuẩn 80 Plus Gold 750W - 850W để đảm bảo độ bền linh kiện và cấp nguồn ổn định khi tải đỉnh.")
                        .currentProduct(device.getCurrentPsu())
                        .recommendedProduct(suggestedPsu)
                        .expectedPerformanceGain("Bảo vệ toàn diện phần cứng, ngăn ngừa sập nguồn và hiện tượng tụt áp")
                        .build());
            }
        }

        healthScore = Math.max(10, Math.min(100, healthScore));

        List<AiRecommendation> savedRecs = recommendationRepository.saveAll(newRecs);

        List<AiDto.RecommendationResponse> recResponses = savedRecs.stream().map(r -> AiDto.RecommendationResponse.builder()
                .id(r.getId())
                .bottleneckType(r.getBottleneckType())
                .severity(r.getSeverity().name())
                .diagnosticText(r.getDiagnosticText())
                .currentComponent(productMapper.toResponse(r.getCurrentProduct()))
                .recommendedProduct(productMapper.toResponse(r.getRecommendedProduct()))
                .expectedPerformanceGain(r.getExpectedPerformanceGain())
                .isViewed(r.getIsViewed())
                .isApplied(r.getIsApplied())
                .createdAt(r.getCreatedAt().toString())
                .build()).collect(Collectors.toList());

        return AiDto.DiagnosticReport.builder()
                .deviceCode(device.getDeviceCode())
                .deviceName(device.getDeviceName())
                .healthScore(healthScore)
                .analyzedSamples(totalSamples)
                .periodDays(30)
                .generatedAt(LocalDateTime.now().toString())
                .metrics(metrics)
                .findings(findings)
                .recommendations(recResponses)
                .build();
    }

    @Transactional
    public AiDto.DiagnosticReport getLatestDiagnostic(String deviceCode) {
        IotDevice device = deviceRepository.findByDeviceCode(deviceCode)
                .orElseThrow(() -> new ResourceNotFoundException("Thiết bị không tồn tại: " + deviceCode));
        if (device.getStatus() != com.linhkien.iotai.entity.enums.DeviceStatus.ONLINE
                && device.getStatus() != com.linhkien.iotai.entity.enums.DeviceStatus.WARNING) {
            return buildEmptyReport(device);
        }
        return analyzeDeviceLogs(device);
    }

    @Transactional
    public void markViewed(Long recommendationId) {
        recommendationRepository.findById(recommendationId).ifPresent(r -> {
            r.setIsViewed(true);
            recommendationRepository.save(r);
        });
    }

    @Transactional
    public void markApplied(Long recommendationId) {
        recommendationRepository.findById(recommendationId).ifPresent(r -> {
            r.setIsApplied(true);
            recommendationRepository.save(r);
        });
    }

    private AiDto.DiagnosticReport buildEmptyReport(IotDevice device) {
        return AiDto.DiagnosticReport.builder()
                .deviceCode(device.getDeviceCode())
                .deviceName(device.getDeviceName())
                .healthScore(100)
                .analyzedSamples(0)
                .periodDays(30)
                .generatedAt(LocalDateTime.now().toString())
                .metrics(AiDto.DiagnosticMetrics.builder()
                        .avgCpuLoad(5.0f)
                        .p95CpuLoad(15.0f)
                        .avgGpuLoad(2.0f)
                        .avgRamUsage(35.0f)
                        .ramOver88Ratio(0.0f)
                        .maxCpuTemp(45.0f)
                        .maxGpuTemp(42.0f)
                        .avgCpuTemp(40.0f)
                        .overheatRatio(0.0f)
                        .peakPowerW(120)
                        .psuWattage(650)
                        .psuLoadRatio(0.18f)
                        .maxFanRpm(1200)
                        .build())
                .findings(List.of(AiDto.FindingItem.builder()
                        .bottleneckType("HEALTHY")
                        .severity("LOW")
                        .diagnosticText("Hệ thống hoạt động ổn định, chưa ghi nhận dấu hiệu nghẽn phần cứng hoặc quá nhiệt.")
                        .build()))
                .recommendations(Collections.emptyList())
                .build();
    }

    @Transactional
    public AiDto.DiagnosticReport simulateBottleneck(String deviceCode, String scenario) {
        IotDevice device = deviceRepository.findByDeviceCode(deviceCode)
                .orElseThrow(() -> new ResourceNotFoundException("Thiết bị không tồn tại: " + deviceCode));

        if ("RESET".equalsIgnoreCase(scenario)) {
            // Delete simulated bottleneck records from DB and recalculate cleanly
            telemetryLogRepository.deleteSimulatedByDeviceId(device.getId());
            telemetryLogRepository.deleteByDeviceIdAndOverheatOrHighStress(device.getId());
            return analyzeDeviceLogs(device);
        }

        // Xóa dữ liệu mô phỏng cũ trước khi nạp kịch bản mới
        telemetryLogRepository.deleteSimulatedByDeviceId(device.getId());

        LocalDateTime now = LocalDateTime.now();
        List<TelemetryLog> fakeLogs = new ArrayList<>();

        // Generate 120 synthetic telemetry logs
        for (int i = 0; i < 120; i++) {
            LocalDateTime timestamp = now.minusMinutes(120 - i);
            TelemetryLog logItem = TelemetryLog.builder()
                    .device(device)
                    .recordedAt(timestamp)
                    .build();

            switch (scenario != null ? scenario.toUpperCase() : "ALL") {
                case "RAM":
                    // Ram bottleneck: RAM > 90%, normal CPU/GPU
                    logItem.setCpuLoad(25.0f + (float)(Math.random() * 15));
                    logItem.setGpuLoad(15.0f + (float)(Math.random() * 10));
                    logItem.setRamUsage(92.0f + (float)(Math.random() * 6));
                    logItem.setCpuTemp(48.0f + (float)(Math.random() * 5));
                    logItem.setGpuTemp(44.0f + (float)(Math.random() * 4));
                    logItem.setPowerDrawW(150 + (int)(Math.random() * 30));
                    logItem.setFanSpeedRpm(1200 + (int)(Math.random() * 150));
                    break;

                case "CPU":
                    // CPU bottleneck: CPU > 95%, GPU < 35%
                    logItem.setCpuLoad(96.0f + (float)(Math.random() * 3.8));
                    logItem.setGpuLoad(18.0f + (float)(Math.random() * 12));
                    logItem.setRamUsage(55.0f + (float)(Math.random() * 15));
                    logItem.setCpuTemp(72.0f + (float)(Math.random() * 6));
                    logItem.setGpuTemp(46.0f + (float)(Math.random() * 5));
                    logItem.setPowerDrawW(220 + (int)(Math.random() * 40));
                    logItem.setFanSpeedRpm(1700 + (int)(Math.random() * 200));
                    break;

                case "THERMAL":
                    // Thermal throttling: CPU Temp >= 89°C
                    logItem.setCpuLoad(80.0f + (float)(Math.random() * 15));
                    logItem.setGpuLoad(65.0f + (float)(Math.random() * 20));
                    logItem.setRamUsage(60.0f + (float)(Math.random() * 10));
                    logItem.setCpuTemp(88.0f + (float)(Math.random() * 6));
                    logItem.setGpuTemp(79.0f + (float)(Math.random() * 5));
                    logItem.setPowerDrawW(260 + (int)(Math.random() * 50));
                    logItem.setFanSpeedRpm(2200 + (int)(Math.random() * 200));
                    break;

                case "PSU":
                    // PSU overload: Peak power draw 500W - 540W on 550W PSU
                    logItem.setCpuLoad(85.0f + (float)(Math.random() * 12));
                    logItem.setGpuLoad(90.0f + (float)(Math.random() * 8));
                    logItem.setRamUsage(70.0f + (float)(Math.random() * 10));
                    logItem.setCpuTemp(75.0f + (float)(Math.random() * 7));
                    logItem.setGpuTemp(76.0f + (float)(Math.random() * 5));
                    logItem.setPowerDrawW(490 + (int)(Math.random() * 45));
                    logItem.setFanSpeedRpm(1900 + (int)(Math.random() * 200));
                    break;

                case "ALL":
                default:
                    // Combination scenario: High RAM + High CPU load + Overheating
                    logItem.setCpuLoad(96.0f + (float)(Math.random() * 3.5));
                    logItem.setGpuLoad(28.0f + (float)(Math.random() * 10));
                    logItem.setRamUsage(92.0f + (float)(Math.random() * 6));
                    logItem.setCpuTemp(89.0f + (float)(Math.random() * 5));
                    logItem.setGpuTemp(78.0f + (float)(Math.random() * 6));
                    logItem.setPowerDrawW(485 + (int)(Math.random() * 45));
                    logItem.setFanSpeedRpm(2250 + (int)(Math.random() * 150));
                    break;
            }

            // Fill all non-null database fields
            float ramTotal = 16.0f;
            float ramUsage = logItem.getRamUsage();
            float ramUsed = Math.round((ramUsage / 100.0f * ramTotal) * 10.0f) / 10.0f;

            logItem.setRamTotalGb(ramTotal);
            logItem.setRamUsedGb(ramUsed);
            logItem.setCpuClockMhz(4200);
            logItem.setAmbientTemp(27.5f + (float)(Math.random() * 2.0));
            logItem.setAmbientHumidity(58.0f + (float)(Math.random() * 5.0));
            logItem.setStatusFlag("SIMULATED");

            fakeLogs.add(logItem);
        }

        telemetryLogRepository.saveAll(fakeLogs);
        return analyzeDeviceLogs(device);
    }

    private float round1(float val) {
        return Math.round(val * 10.0f) / 10.0f;
    }

    private float round2(float val) {
        return Math.round(val * 100.0f) / 100.0f;
    }
}
