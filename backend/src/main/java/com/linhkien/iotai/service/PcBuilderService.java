package com.linhkien.iotai.service;

import com.linhkien.iotai.dto.pcbuilder.PcBuilderDto;
import com.linhkien.iotai.dto.product.ProductDto;
import com.linhkien.iotai.entity.Product;
import com.linhkien.iotai.entity.ProductSpec;
import com.linhkien.iotai.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PcBuilderService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Transactional(readOnly = true)
    public PcBuilderDto.CompatibilityReport validateBuild(PcBuilderDto.BuildSelection selection) {
        List<PcBuilderDto.IssueItem> issues = new ArrayList<>();
        List<PcBuilderDto.PassedItem> passed = new ArrayList<>();

        Product cpu = selection.getCpuId() != null ? productRepository.findByIdWithDetails(selection.getCpuId()).orElse(null) : null;
        Product mb = selection.getMainboardId() != null ? productRepository.findByIdWithDetails(selection.getMainboardId()).orElse(null) : null;
        Product ram = selection.getRamId() != null ? productRepository.findByIdWithDetails(selection.getRamId()).orElse(null) : null;
        Product gpu = selection.getGpuId() != null ? productRepository.findByIdWithDetails(selection.getGpuId()).orElse(null) : null;
        Product ssd = selection.getStorageId() != null ? productRepository.findByIdWithDetails(selection.getStorageId()).orElse(null) : null;
        Product psu = selection.getPsuId() != null ? productRepository.findByIdWithDetails(selection.getPsuId()).orElse(null) : null;
        Product cooler = selection.getCoolerId() != null ? productRepository.findByIdWithDetails(selection.getCoolerId()).orElse(null) : null;
        Product pcCase = selection.getCaseId() != null ? productRepository.findByIdWithDetails(selection.getCaseId()).orElse(null) : null;

        // BR01: CPU & Mainboard Socket
        if (cpu != null && mb != null) {
            String cpuSocket = cpu.getSpecs() != null ? cpu.getSpecs().getSocket() : null;
            String mbSocket = mb.getSpecs() != null ? mb.getSpecs().getSocket() : null;

            if (cpuSocket != null && mbSocket != null && !cpuSocket.equalsIgnoreCase(mbSocket)) {
                issues.add(PcBuilderDto.IssueItem.builder()
                        .rule("BR01")
                        .severity("ERROR")
                        .message("Không tương thích Socket: CPU dùng socket " + cpuSocket + " nhưng Bo mạch chủ dùng socket " + mbSocket)
                        .build());
            } else if (cpuSocket != null && mbSocket != null) {
                passed.add(PcBuilderDto.PassedItem.builder()
                        .rule("BR01")
                        .message("Tương thích Socket: Cả CPU và Mainboard đều sử dụng socket " + cpuSocket)
                        .build());
            }
        }

        // BR02: RAM Generation Match
        if (mb != null && ram != null) {
            String mbRamGen = mb.getSpecs() != null ? mb.getSpecs().getRamGeneration() : null;
            String ramGen = ram.getSpecs() != null ? ram.getSpecs().getRamGeneration() : null;

            if (mbRamGen != null && ramGen != null && !mbRamGen.equalsIgnoreCase(ramGen)) {
                issues.add(PcBuilderDto.IssueItem.builder()
                        .rule("BR02")
                        .severity("ERROR")
                        .message("Không tương thích chuẩn RAM: Mainboard hỗ trợ " + mbRamGen + " nhưng thanh RAM được chọn là " + ramGen)
                        .build());
            } else if (mbRamGen != null && ramGen != null) {
                passed.add(PcBuilderDto.PassedItem.builder()
                        .rule("BR02")
                        .message("Tương thích chuẩn RAM: Mainboard và RAM cùng chuẩn " + ramGen)
                        .build());
            }
        }

        // Calculate Total TDP: CPU + GPU + base 50W
        int totalTdp = 50; // base system (fans, motherboard, chipset, storage)
        if (cpu != null && cpu.getSpecs() != null) totalTdp += cpu.getSpecs().getTdp();
        if (gpu != null && gpu.getSpecs() != null) totalTdp += gpu.getSpecs().getTdp();
        if (ssd != null && ssd.getSpecs() != null) totalTdp += ssd.getSpecs().getTdp();

        // BR03: PSU Safety Wattage Margin: P_PSU >= 1.25 * sum(TDP)
        int recommendedPsu = (int) Math.ceil(totalTdp * 1.25);
        if (psu != null && psu.getSpecs() != null && psu.getSpecs().getPsuWattage() != null) {
            int psuWatt = psu.getSpecs().getPsuWattage();
            if (psuWatt < recommendedPsu) {
                issues.add(PcBuilderDto.IssueItem.builder()
                        .rule("BR03")
                        .severity("ERROR")
                        .message("Công suất nguồn không đủ an toàn: Nguồn " + psuWatt + "W thấp hơn công suất khuyến nghị tối thiểu " + recommendedPsu + "W (hệ số an toàn 1.25x TDP " + totalTdp + "W)")
                        .build());
            } else {
                passed.add(PcBuilderDto.PassedItem.builder()
                        .rule("BR03")
                        .message("Công suất nguồn đạt chuẩn an toàn: " + psuWatt + "W (đáp ứng khuyến nghị tối thiểu " + recommendedPsu + "W)")
                        .build());
            }
        }

        // BR04: Cooler TDP Rating >= CPU TDP
        if (cpu != null && cooler != null && cpu.getSpecs() != null && cooler.getSpecs() != null) {
            int cpuTdp = cpu.getSpecs().getTdp();
            Integer coolerTdp = cooler.getSpecs().getCoolerTdpRating();
            if (coolerTdp != null && coolerTdp < cpuTdp) {
                issues.add(PcBuilderDto.IssueItem.builder()
                        .rule("BR04")
                        .severity("ERROR")
                        .message("Tản nhiệt không đủ công suất giải nhiệt: Khả năng giải nhiệt " + coolerTdp + "W thấp hơn TDP của CPU " + cpuTdp + "W")
                        .build());
            } else if (coolerTdp != null) {
                passed.add(PcBuilderDto.PassedItem.builder()
                        .rule("BR04")
                        .message("Tản nhiệt đáp ứng tốt TDP: Giải nhiệt " + coolerTdp + "W cho CPU " + cpuTdp + "W")
                        .build());
            }
        }

        // BR05: Mainboard & Case Form Factor
        if (mb != null && pcCase != null && mb.getSpecs() != null && pcCase.getSpecs() != null) {
            String mbForm = mb.getSpecs().getFormFactor();
            String supportedForms = pcCase.getSpecs().getSupportedFormFactors();
            if (mbForm != null && supportedForms != null) {
                List<String> allowed = Arrays.stream(supportedForms.split(","))
                        .map(String::trim)
                        .map(String::toUpperCase)
                        .collect(Collectors.toList());

                if (!allowed.contains(mbForm.toUpperCase())) {
                    issues.add(PcBuilderDto.IssueItem.builder()
                            .rule("BR05")
                            .severity("ERROR")
                            .message("Kích thước Mainboard không vừa vỏ Case: Mainboard chuẩn " + mbForm + " không vừa Case (chỉ hỗ trợ: " + supportedForms + ")")
                            .build());
                } else {
                    passed.add(PcBuilderDto.PassedItem.builder()
                            .rule("BR05")
                            .message("Kích thước vừa vặn: Case hỗ trợ lắp Mainboard chuẩn " + mbForm)
                            .build());
                }
            }
        }

        // BR06: GPU Length vs Case Clearance
        if (gpu != null && pcCase != null && gpu.getSpecs() != null && pcCase.getSpecs() != null) {
            Integer gpuLength = gpu.getSpecs().getGpuLengthMm();
            Integer maxCaseLength = pcCase.getSpecs().getMaxGpuLengthMm();
            if (gpuLength != null && maxCaseLength != null && gpuLength > maxCaseLength) {
                issues.add(PcBuilderDto.IssueItem.builder()
                        .rule("BR06")
                        .severity("ERROR")
                        .message("Card đồ họa dài quá cỡ vỏ Case: Chiều dài GPU " + gpuLength + "mm vượt quá khoảng trống tối đa của Case " + maxCaseLength + "mm")
                        .build());
            } else if (gpuLength != null && maxCaseLength != null) {
                passed.add(PcBuilderDto.PassedItem.builder()
                        .rule("BR06")
                        .message("Kích thước GPU tương thích: Chiều dài " + gpuLength + "mm nằm trong giới hạn tối đa " + maxCaseLength + "mm của Case")
                        .build());
            }
        }

        // Calculate Total Price
        BigDecimal totalPrice = BigDecimal.ZERO;
        List<Product> allSelected = Arrays.asList(cpu, mb, ram, gpu, ssd, psu, cooler, pcCase);
        for (Product p : allSelected) {
            if (p != null && p.getPrice() != null) {
                totalPrice = totalPrice.add(p.getPrice());
            }
        }

        boolean isCompatible = issues.stream().noneMatch(i -> "ERROR".equalsIgnoreCase(i.getSeverity()));

        return PcBuilderDto.CompatibilityReport.builder()
                .compatible(isCompatible)
                .totalPrice(totalPrice)
                .totalTdp(totalTdp)
                .recommendedPsu(recommendedPsu)
                .issues(issues)
                .passed(passed)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ProductDto.Response> getCompatibleProducts(String slot, PcBuilderDto.BuildSelection currentSelection) {
        String categorySlug = slot.toLowerCase().trim();
        List<Product> candidates = productRepository.findByCategorySlug(categorySlug);

        // Filter candidates based on current selections
        List<Product> compatibleList = candidates.stream().filter(candidate -> {
            PcBuilderDto.BuildSelection testSelection = cloneSelection(currentSelection);
            setSelectionSlot(testSelection, slot, candidate.getId());
            PcBuilderDto.CompatibilityReport report = validateBuild(testSelection);
            return report.isCompatible();
        }).collect(Collectors.toList());

        return compatibleList.stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PcBuilderDto.QuickCheckResponse quickCheck(Long productAId, Long productBId) {
        Product a = productRepository.findByIdWithDetails(productAId).orElse(null);
        Product b = productRepository.findByIdWithDetails(productBId).orElse(null);

        if (a == null || b == null) {
            return PcBuilderDto.QuickCheckResponse.builder()
                    .compatible(false)
                    .messages(List.of("Không tìm thấy thông tin một trong hai sản phẩm."))
                    .build();
        }

        PcBuilderDto.BuildSelection selection = new PcBuilderDto.BuildSelection();
        setSelectionByProduct(selection, a);
        setSelectionByProduct(selection, b);

        PcBuilderDto.CompatibilityReport report = validateBuild(selection);

        List<String> messages = new ArrayList<>();
        if (!report.isCompatible()) {
            report.getIssues().forEach(i -> messages.add(i.getMessage()));
        } else {
            if (!report.getPassed().isEmpty()) {
                report.getPassed().forEach(p -> messages.add(p.getMessage()));
            } else {
                messages.add("Hai linh kiện tương thích tốt trong hệ thống phần cứng.");
            }
        }

        return PcBuilderDto.QuickCheckResponse.builder()
                .compatible(report.isCompatible())
                .messages(messages)
                .build();
    }

    private PcBuilderDto.BuildSelection cloneSelection(PcBuilderDto.BuildSelection s) {
        if (s == null) return new PcBuilderDto.BuildSelection();
        return PcBuilderDto.BuildSelection.builder()
                .cpuId(s.getCpuId())
                .mainboardId(s.getMainboardId())
                .ramId(s.getRamId())
                .gpuId(s.getGpuId())
                .storageId(s.getStorageId())
                .psuId(s.getPsuId())
                .coolerId(s.getCoolerId())
                .caseId(s.getCaseId())
                .build();
    }

    private void setSelectionSlot(PcBuilderDto.BuildSelection s, String slot, Long id) {
        switch (slot.toUpperCase().trim()) {
            case "CPU" -> s.setCpuId(id);
            case "MAINBOARD" -> s.setMainboardId(id);
            case "RAM" -> s.setRamId(id);
            case "VGA" -> s.setGpuId(id);
            case "SSD" -> s.setStorageId(id);
            case "PSU" -> s.setPsuId(id);
            case "COOLER" -> s.setCoolerId(id);
            case "CASE" -> s.setCaseId(id);
        }
    }

    private void setSelectionByProduct(PcBuilderDto.BuildSelection s, Product p) {
        if (p.getCategory() == null) return;
        setSelectionSlot(s, p.getCategory().getSlug(), p.getId());
    }

    @Transactional(readOnly = true)
    public PcBuilderDto.AiSuggestResponse aiSuggestBuild(BigDecimal budget, String purpose) {
        if (budget == null || budget.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Ngân sách phải lớn hơn 0₫");
        }
        String mode = purpose != null ? purpose.toUpperCase().trim() : "GAMING";

        List<Product> all = productRepository.findAll().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()) && p.getStockQuantity() != null && p.getStockQuantity() > 0)
                .collect(Collectors.toList());

        Map<String, List<Product>> byCat = new HashMap<>();
        for (Product p : all) {
            if (p.getCategory() != null && p.getCategory().getSlug() != null) {
                byCat.computeIfAbsent(p.getCategory().getSlug().toLowerCase(), k -> new ArrayList<>()).add(p);
            }
        }
        byCat.values().forEach(list -> list.sort(Comparator.comparing(Product::getPrice)));

        List<Product> cpus = byCat.getOrDefault("cpu", List.of());
        List<Product> mbs = byCat.getOrDefault("mainboard", List.of());
        List<Product> rams = byCat.getOrDefault("ram", List.of());
        List<Product> gpus = byCat.getOrDefault("vga", List.of());
        List<Product> ssds = byCat.getOrDefault("ssd", List.of());
        List<Product> psus = byCat.getOrDefault("psu", List.of());
        List<Product> coolers = byCat.getOrDefault("cooler", List.of());
        List<Product> cases = byCat.getOrDefault("case", List.of());

        if (cpus.isEmpty() || mbs.isEmpty() || rams.isEmpty() || ssds.isEmpty() || psus.isEmpty() || coolers.isEmpty() || cases.isEmpty()) {
            throw new IllegalStateException("Kho hàng chưa đủ danh mục linh kiện tối thiểu để ráp máy");
        }

        // Candidate GPU list: all GPUs + null (iGPU fallback for low budget or Office)
        List<Product> gpuOptions = new ArrayList<>(gpus);
        gpuOptions.add(null);

        double bestScore = -1;
        Product[] bestCombo = null;
        BigDecimal bestPrice = BigDecimal.ZERO;
        int bestTdp = 0;
        int bestRecPsu = 0;

        Product[] cheapestCombo = null;
        BigDecimal cheapestPrice = null;
        int cheapestTdp = 0;
        int cheapestRecPsu = 0;

        Product cheapestSsd = ssds.get(0);

        for (Product cpu : cpus) {
            String cpuSocket = cpu.getSpecs() != null ? cpu.getSpecs().getSocket() : null;
            int cpuTdp = cpu.getSpecs() != null ? cpu.getSpecs().getTdp() : 65;

            // Find cheapest compatible cooler (BR04)
            Product bestCoolerForCpu = coolers.stream()
                    .filter(c -> c.getSpecs() == null || c.getSpecs().getCoolerTdpRating() == null || c.getSpecs().getCoolerTdpRating() >= cpuTdp)
                    .findFirst().orElse(null);
            if (bestCoolerForCpu == null) continue;

            for (Product mb : mbs) {
                // BR01: Socket match
                String mbSocket = mb.getSpecs() != null ? mb.getSpecs().getSocket() : null;
                if (cpuSocket != null && mbSocket != null && !cpuSocket.equalsIgnoreCase(mbSocket)) continue;

                // BR02: RAM generation match
                String mbRamGen = mb.getSpecs() != null ? mb.getSpecs().getRamGeneration() : null;
                List<Product> compatRams = rams.stream()
                        .filter(r -> mbRamGen == null || r.getSpecs() == null || r.getSpecs().getRamGeneration() == null
                                || mbRamGen.equalsIgnoreCase(r.getSpecs().getRamGeneration()))
                        .collect(Collectors.toList());
                if (compatRams.isEmpty()) continue;

                // Pick RAM: cheapest or mid-tier if budget allows
                List<Product> ramChoices = compatRams.size() > 2
                        ? List.of(compatRams.get(0), compatRams.get(compatRams.size() / 2))
                        : compatRams;

                String mbForm = mb.getSpecs() != null ? mb.getSpecs().getFormFactor() : null;

                for (Product ram : ramChoices) {
                    for (Product gpu : gpuOptions) {
                        int ssdTdp = cheapestSsd.getSpecs() != null ? cheapestSsd.getSpecs().getTdp() : 5;
                        int gpuTdp = (gpu != null && gpu.getSpecs() != null) ? gpu.getSpecs().getTdp() : 0;
                        int totalTdp = 50 + cpuTdp + gpuTdp + ssdTdp;
                        int recPsu = (int) Math.ceil(totalTdp * 1.25);

                        // BR03: PSU
                        Product bestPsu = psus.stream()
                                .filter(p -> p.getSpecs() == null || p.getSpecs().getPsuWattage() == null || p.getSpecs().getPsuWattage() >= recPsu)
                                .findFirst().orElse(null);
                        if (bestPsu == null) continue;

                        // BR05 & BR06: Case
                        Integer gpuLen = (gpu != null && gpu.getSpecs() != null) ? gpu.getSpecs().getGpuLengthMm() : null;
                        Product bestCase = cases.stream()
                                .filter(c -> {
                                    if (c.getSpecs() == null) return true;
                                    if (mbForm != null && c.getSpecs().getSupportedFormFactors() != null) {
                                        boolean formOk = Arrays.stream(c.getSpecs().getSupportedFormFactors().split(","))
                                                .map(s -> s.trim().toUpperCase())
                                                .anyMatch(s -> s.equals(mbForm.toUpperCase()));
                                        if (!formOk) return false;
                                    }
                                    if (gpuLen != null && c.getSpecs().getMaxGpuLengthMm() != null && gpuLen > c.getSpecs().getMaxGpuLengthMm()) {
                                        return false;
                                    }
                                    return true;
                                })
                                .findFirst().orElse(null);
                        if (bestCase == null) continue;

                        // Also pick best SSD that fits if we have spare budget, default cheapestSsd
                        BigDecimal sum = cpu.getPrice()
                                .add(mb.getPrice())
                                .add(ram.getPrice())
                                .add(gpu != null ? gpu.getPrice() : BigDecimal.ZERO)
                                .add(cheapestSsd.getPrice())
                                .add(bestPsu.getPrice())
                                .add(bestCoolerForCpu.getPrice())
                                .add(bestCase.getPrice());

                        if (cheapestPrice == null || sum.compareTo(cheapestPrice) < 0) {
                            cheapestPrice = sum;
                            cheapestCombo = new Product[]{cpu, mb, ram, gpu, cheapestSsd, bestPsu, bestCoolerForCpu, bestCase};
                            cheapestTdp = totalTdp;
                            cheapestRecPsu = recPsu;
                        }

                        if (sum.compareTo(budget) <= 0) {
                            double cpuVal = cpu.getPrice().doubleValue();
                            double gpuVal = gpu != null ? gpu.getPrice().doubleValue() : 0;
                            double ramVal = ram.getPrice().doubleValue();
                            double totalVal = sum.doubleValue();

                            double score;
                            if ("GAMING".equals(mode)) {
                                score = (gpu != null ? 5_000_000.0 : 0.0) + gpuVal * 1.5 + cpuVal * 1.1 + totalVal * 0.25;
                            } else if ("WORKSTATION".equals(mode)) {
                                score = (gpu != null ? 3_000_000.0 : 0.0) + cpuVal * 1.5 + ramVal * 1.2 + gpuVal * 1.1 + totalVal * 0.2;
                            } else {
                                // OFFICE
                                score = cpuVal * 1.2 + ramVal * 1.1 + totalVal * 0.5;
                            }

                            if (score > bestScore) {
                                bestScore = score;
                                bestCombo = new Product[]{cpu, mb, ram, gpu, cheapestSsd, bestPsu, bestCoolerForCpu, bestCase};
                                bestPrice = sum;
                                bestTdp = totalTdp;
                                bestRecPsu = recPsu;
                            }
                        }
                    }
                }
            }
        }

        boolean withinBudget = bestCombo != null;
        Product[] chosen = withinBudget ? bestCombo : cheapestCombo;
        BigDecimal finalPrice = withinBudget ? bestPrice : (cheapestPrice != null ? cheapestPrice : BigDecimal.ZERO);
        int finalTdp = withinBudget ? bestTdp : cheapestTdp;
        int finalRecPsu = withinBudget ? bestRecPsu : cheapestRecPsu;

        if (chosen == null) {
            throw new IllegalStateException("Không tìm thấy tổ hợp linh kiện tương thích trong kho.");
        }

        String summary = withinBudget
                ? String.format("AI đã chọn cấu hình %s tối ưu trong ngân sách %,.0f₫ (Tổng: %,.0f₫, Dư: %,.0f₫). Tất cả linh kiện đều còn hàng và tương thích 100%% (BR01-BR06).",
                mode, budget, finalPrice, budget.subtract(finalPrice))
                : String.format("Ngân sách %,.0f₫ chưa đủ cho bộ máy đầy đủ trong kho. AI gợi ý cấu hình tương thích tiết kiệm nhất hiện có với tổng giá %,.0f₫.",
                budget, finalPrice);

        return PcBuilderDto.AiSuggestResponse.builder()
                .withinBudget(withinBudget)
                .budget(budget)
                .totalPrice(finalPrice)
                .remainingBudget(budget.subtract(finalPrice))
                .totalTdp(finalTdp)
                .recommendedPsu(finalRecPsu)
                .aiSummary(summary)
                .cpu(productMapper.toResponse(chosen[0]))
                .mainboard(productMapper.toResponse(chosen[1]))
                .ram(productMapper.toResponse(chosen[2]))
                .gpu(chosen[3] != null ? productMapper.toResponse(chosen[3]) : null)
                .storage(productMapper.toResponse(chosen[4]))
                .psu(productMapper.toResponse(chosen[5]))
                .cooler(productMapper.toResponse(chosen[6]))
                .caseProduct(productMapper.toResponse(chosen[7]))
                .build();
    }
}
