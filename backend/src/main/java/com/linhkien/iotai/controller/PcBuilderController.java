package com.linhkien.iotai.controller;

import com.linhkien.iotai.dto.ApiResponse;
import com.linhkien.iotai.dto.pcbuilder.PcBuilderDto;
import com.linhkien.iotai.dto.product.ProductDto;
import com.linhkien.iotai.security.UserPrincipal;
import com.linhkien.iotai.service.GeneralAppService;
import com.linhkien.iotai.service.PcBuilderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pc-builder")
@RequiredArgsConstructor
public class PcBuilderController {

    private final PcBuilderService pcBuilderService;
    private final GeneralAppService generalAppService;

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<PcBuilderDto.CompatibilityReport>> validateBuild(@RequestBody PcBuilderDto.BuildSelection selection) {
        return ResponseEntity.ok(ApiResponse.ok(pcBuilderService.validateBuild(selection)));
    }

    @GetMapping("/compatible-products")
    public ResponseEntity<ApiResponse<List<ProductDto.Response>>> getCompatibleProducts(
            @RequestParam String slot,
            @RequestParam(required = false) Long cpuId,
            @RequestParam(required = false) Long mainboardId,
            @RequestParam(required = false) Long ramId,
            @RequestParam(required = false) Long gpuId,
            @RequestParam(required = false) Long storageId,
            @RequestParam(required = false) Long psuId,
            @RequestParam(required = false) Long coolerId,
            @RequestParam(required = false) Long caseId) {

        PcBuilderDto.BuildSelection selection = PcBuilderDto.BuildSelection.builder()
                .cpuId(cpuId)
                .mainboardId(mainboardId)
                .ramId(ramId)
                .gpuId(gpuId)
                .storageId(storageId)
                .psuId(psuId)
                .coolerId(coolerId)
                .caseId(caseId)
                .build();

        return ResponseEntity.ok(ApiResponse.ok(pcBuilderService.getCompatibleProducts(slot, selection)));
    }

    @PostMapping("/quick-check")
    public ResponseEntity<ApiResponse<PcBuilderDto.QuickCheckResponse>> quickCheck(@RequestBody PcBuilderDto.QuickCheckRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(pcBuilderService.quickCheck(request.getProductAId(), request.getProductBId())));
    }

    @PostMapping("/builds")
    public ResponseEntity<ApiResponse<PcBuilderDto.BuildResponse>> saveBuild(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody PcBuilderDto.SaveBuildRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Lưu cấu hình PC thành công", generalAppService.savePcBuild(user.getId(), request)));
    }

    @GetMapping("/builds/my")
    public ResponseEntity<ApiResponse<List<PcBuilderDto.BuildResponse>>> getMyBuilds(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.ok(generalAppService.getMyBuilds(user.getId())));
    }

    @DeleteMapping("/builds/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBuild(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        generalAppService.deleteBuild(id, user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa cấu hình PC", null));
    }
}
