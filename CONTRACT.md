# CONTRACT — Hợp đồng kỹ thuật chung (Backend ⇄ Frontend ⇄ IoT)

Đề tài: **ỨNG DỤNG IOTS VÀ AI VÀO HỆ THỐNG WEB BÁN LINH KIỆN MÁY TÍNH** — Trần Hữu Nhân (HCMUNRE) — GVHD: ThS. Nguyễn Thanh Truyền.

Tài liệu này là NGUỒN SỰ THẬT DUY NHẤT. Mọi tên trường JSON dùng **camelCase**. Thời gian dạng ISO `LocalDateTime` (`2026-10-18T09:00:00`). Tiền là số (BigDecimal → JSON number, đơn vị VNĐ).

## 0. Cấu trúc monorepo

```
linhkien-iot-ai/
├── backend/            Spring Boot 3.2, Java 21, Maven, package gốc com.linhkien.iotai
├── frontend/           React 18 + Vite + TypeScript + Tailwind 3.4
├── iot-simulator/      Python paho-mqtt simulator
├── mosquitto/config/   mosquitto.conf
├── database/           schema.sql + data.sql (bản sao từ backend/src/main/resources)
├── docker-compose.yml  postgres, redis, rabbitmq, mosquitto, backend, frontend, simulator
└── README.md
```

## 1. Ports & hạ tầng

| Service | Host:Port | Ghi chú |
|---|---|---|
| Backend | `localhost:8080` | REST `/api/**`, WebSocket SockJS `/ws` |
| Frontend (Vite dev) | `localhost:5173` | Proxy `/api` và `/ws` → `http://localhost:8080` |
| Frontend (docker nginx) | `localhost:3000` | nginx proxy `/api`, `/ws` → `backend:8080` |
| PostgreSQL 15 | `5432` | db `linhkien_iotai`, user `postgres`, pass `postgres` |
| Redis 7 | `6379` | cache + cổng giữ chỗ tồn kho (stock gate) |
| RabbitMQ 3 | `5672`, UI `15672` | guest/guest |
| Mosquitto | `1883` | anonymous |

Cờ cấu hình backend (env): `APP_REDIS_ENABLED`, `APP_RABBITMQ_ENABLED`, `APP_MQTT_ENABLED`, `APP_SIMULATOR_INTERNAL_ENABLED`. Khi tắt, backend vẫn chạy được (fallback in-memory / xử lý đồng bộ).

## 2. Định dạng response chung

Mọi REST response bọc trong:
```json
{ "success": true, "message": "OK", "data": <payload> }
```
Lỗi: HTTP 4xx/5xx với `{ "success": false, "message": "Mô tả lỗi tiếng Việt", "data": null, "errors": { "field": "msg" } }` (`errors` chỉ có khi lỗi validation).

Phân trang (`PageResponse<T>`):
```json
{ "content": [], "page": 0, "size": 12, "totalElements": 40, "totalPages": 4 }
```

## 3. Auth (JWT Bearer, stateless)

Header: `Authorization: Bearer <token>`. Role: `ROLE_CUSTOMER`, `ROLE_ADMIN`, `ROLE_TECHNICIAN`.

| Method | Path | Body | Data trả về |
|---|---|---|---|
| POST | `/api/auth/register` | `{username, email, password, fullName, phone}` | `AuthResponse` |
| POST | `/api/auth/login` | `{username, password}` (username hoặc email) | `AuthResponse` |
| GET | `/api/auth/me` | — | `UserDto` |

`AuthResponse = { token: string, user: UserDto }`
`UserDto = { id, username, fullName, email, phone, role, createdAt }`

Tài khoản seed: `admin / admin123` (ROLE_ADMIN), `nhan / 123456` (ROLE_CUSTOMER, sở hữu thiết bị `PC-NHAN-001`), `tech / tech123` (ROLE_TECHNICIAN).

## 4. Danh mục & Sản phẩm (public GET)

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/categories` | `CategoryDto[]` sắp theo `displayOrder` |
| GET | `/api/products` | Query: `keyword, category (slug), brands (csv), minPrice, maxPrice, socket, ramGeneration, inStock (bool), sort (newest\|price_asc\|price_desc\|name), page (0-based), size` → `PageResponse<ProductDto>` |
| GET | `/api/products/suggest?q=` | Autocomplete, tối đa 8: `[{id, name, slug, imageUrl, price, categorySlug}]` |
| GET | `/api/products/brands` | `string[]` |
| GET | `/api/products/{idOrSlug}` | `ProductDto` |
| GET | `/api/products/{id}/reviews` | `ReviewDto[]` |
| POST | `/api/products/{id}/reviews` (auth) | `{rating 1..5, comment}` → `ReviewDto` |

`CategoryDto = { id, name, slug, icon, description, displayOrder, productCount }`
Slug danh mục cố định: `cpu, mainboard, ram, vga, ssd, psu, cooler, case`. `icon` là tên icon lucide (`Cpu, CircuitBoard, MemoryStick, Gpu, HardDrive, PlugZap, Fan, Box`).

```ts
ProductDto = {
  id, categoryId, categoryName, categorySlug,
  name, slug, brand, price, originalPrice, stockQuantity, warrantyMonths,
  imageUrl, images: string[], description, isActive,
  rating: number, reviewCount: number,
  specs: ProductSpecDto | null
}
ProductSpecDto = {
  socket, ramGeneration, ramBus, formFactor, tdp, psuWattage, psuEfficiency,
  vram, storageInterface, coolingType, dimensions,
  coolerTdpRating,        // W, tản nhiệt (BR04)
  gpuLengthMm,            // mm, VGA (BR06)
  maxGpuLengthMm,         // mm, Case (BR06)
  supportedFormFactors,   // "ATX,Micro-ATX,Mini-ITX" — Case (BR05)
  cores, threads, baseClock, boostClock,   // CPU (GHz dạng string "4.6GHz")
  capacityGb,             // RAM/SSD/VGA khi cần
  technicalJson: Record<string, string|number|boolean>  // bảng thông số mở rộng
}
ReviewDto = { id, productId, userFullName, rating, comment, createdAt }
```

## 5. Giỏ hàng & Coupon

Giỏ hàng lưu phía client (Zustand + localStorage). Kiểm tra tồn kho realtime:

| Method | Path | Body → Data |
|---|---|---|
| POST | `/api/cart/validate` (public) | `{items:[{productId, quantity}]}` → `[{productId, name, requested, stockQuantity, available: bool, price}]` |
| POST | `/api/coupons/apply` (public) | `{code, subtotal}` → `{code, description, discountAmount, freeShipping: bool}` ; mã sai → 400 |

Coupon có sẵn: `NHAN10` (giảm 10%, tối đa 500.000đ), `IOTAI200K` (giảm 200.000đ cho đơn ≥ 3.000.000đ), `FREESHIP` (miễn phí vận chuyển).
Phí vận chuyển: miễn phí nếu tạm tính (sau giảm) ≥ 5.000.000đ, ngược lại 40.000đ.

## 6. Đơn hàng

Enum: `paymentMethod: COD | BANK_TRANSFER_QR`; `paymentStatus: UNPAID | PAID | REFUNDED`; `orderStatus: CHO_XAC_NHAN | DA_XAC_NHAN | DANG_GIAO | DA_GIAO | DA_HUY`.

| Method | Path | Body → Data |
|---|---|---|
| POST | `/api/orders` (auth) | `CreateOrderRequest` → `OrderDto` |
| GET | `/api/orders/my` (auth) | `OrderDto[]` mới nhất trước |
| GET | `/api/orders/track/{orderCode}` (public) | `OrderDto` |
| POST | `/api/orders/{id}/cancel` (auth, chủ đơn) | → `OrderDto` (chỉ khi `CHO_XAC_NHAN`) |

```ts
CreateOrderRequest = { customerName, phone, shippingAddress, city, note?, paymentMethod, couponCode?, items: [{productId, quantity}] }
OrderDto = {
  id, orderCode, userId, customerName, phone, shippingAddress, city,
  paymentMethod, paymentStatus, orderStatus,
  totalAmount, discountAmount, couponCode, shippingFee, finalAmount, note,
  createdAt, updatedAt,
  items: [{ id, productId, productName, imageUrl, unitPrice, quantity, subtotal }],
  payment: null | { bankId, bankName, accountNo, accountName, amount, content, qrPayload, qrImageUrl }
}
```
`orderCode` dạng `LK` + `yyMMdd` + 6 ký tự A-Z0-9. `payment` chỉ có khi `BANK_TRANSFER_QR`: `qrPayload` = chuỗi EMVCo VietQR (Napas 247, có CRC16) để frontend tự vẽ QR; `qrImageUrl` = `https://img.vietqr.io/image/{bankId}-{accountNo}-compact2.png?amount=..&addInfo=..&accountName=..`.

Luồng đặt hàng (BR07, BR08): Redis Lua giữ chỗ tồn kho → `@Transactional` + `PESSIMISTIC_WRITE` lock từng product (sắp theo id tránh deadlock) → tạo orders + order_items → trừ kho → commit → publish `order.created` lên RabbitMQ. Bất kỳ lỗi nào → rollback DB + hoàn trả Redis. Lỗi hết hàng → HTTP 409 message `"Sản phẩm X chỉ còn N trong kho"`.

## 7. PC Builder

Slot: `CPU, MAINBOARD, RAM, VGA, SSD, PSU, COOLER, CASE`.

| Method | Path | Body/Query → Data |
|---|---|---|
| POST | `/api/pc-builder/validate` (public) | `BuildSelection` → `CompatibilityReport` |
| GET | `/api/pc-builder/compatible-products` (public) | Query `slot` + các id đã chọn (`cpuId, mainboardId, ramId, gpuId, storageId, psuId, coolerId, caseId`) → `ProductDto[]` đã lọc tương thích |
| POST | `/api/pc-builder/quick-check` (public) | `{productAId, productBId}` → `{compatible, messages: string[]}` |
| POST | `/api/pc-builder/builds` (auth) | `BuildSelection & {buildName}` → `PcBuildDto` |
| GET | `/api/pc-builder/builds/my` (auth) | `PcBuildDto[]` |
| DELETE | `/api/pc-builder/builds/{id}` (auth) | — |

```ts
BuildSelection = { cpuId?, mainboardId?, ramId?, gpuId?, storageId?, psuId?, coolerId?, caseId? }
CompatibilityReport = {
  compatible: boolean, totalPrice, totalTdp, recommendedPsu,   // recommendedPsu = ceil(totalTdp*1.25)
  issues: [{ rule: "BR01".."BR06", severity: "ERROR"|"WARNING", message }],
  passed: [{ rule, message }]
}
PcBuildDto = { id, buildName, totalPrice, totalTdp, recommendedPsu, isCompatible, compatibilityReport, createdAt,
               cpu, mainboard, ram, gpu, storage, psu, cooler, caseProduct }   // mỗi cái ProductDto|null
```
Tổng TDP = CPU.tdp + VGA.tdp + 50W (mainboard/RAM/SSD/quạt cố định, cộng thêm `tdp` của RAM/SSD/Mainboard nếu có).

## 8. IoT

| Method | Path | Body → Data |
|---|---|---|
| GET | `/api/iot/devices/my` (auth) | `DeviceDto[]` (admin/tech: tất cả) |
| POST | `/api/iot/devices` (auth) | `{deviceName, roomLocation, macAddress?}` → `DeviceDto` (sinh `deviceCode` `PC-XXXXXX`) |
| GET | `/api/iot/devices/{deviceCode}/telemetry?minutes=60` (auth) | `TelemetryDto[]` tăng dần theo thời gian (tối đa 500 điểm, tự downsample) |
| GET | `/api/iot/devices/{deviceCode}/latest` (auth) | `TelemetryDto` |
| GET | `/api/iot/devices/{deviceCode}/alerts` (auth) | `AlertDto[]` 50 gần nhất |
| POST | `/api/iot/simulate` (auth) | `{deviceCode, scenario: IDLE\|GAMING\|STRESS\|STOP}` → `{deviceCode, scenario}` |

```ts
DeviceDto = { id, userId, ownerName, deviceCode, deviceName, macAddress, status: "ONLINE"|"OFFLINE"|"WARNING",
              esp32Ip, roomLocation, lastPing, currentScenario,
              currentCpu, currentMainboard, currentRam, currentGpu, currentPsu, currentCooler }  // ProductDto|null: cấu hình PC hiện tại
TelemetryDto = { deviceCode, cpuLoad, cpuTemp, cpuClockMhz, ramUsage, ramUsedGb, ramTotalGb, gpuLoad, gpuTemp,
                 fanSpeedRpm, powerDrawW, ambientTemp, ambientHumidity, statusFlag, recordedAt }
AlertDto = { id, deviceCode, type: "ALERT_OVERHEAT"|"AMBIENT_HEAT"|"FAN_FAILURE"|"PSU_OVERLOAD", severity: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", message, value, createdAt }
```
`statusFlag`: `NORMAL | HIGH_LOAD | ALERT_OVERHEAT | AMBIENT_HEAT`.
Thiết bị OFFLINE nếu `lastPing` > 30 giây (scheduler mỗi 10s).

### WebSocket (STOMP over SockJS, endpoint `/ws`, không cần auth)
- `/topic/telemetry/{deviceCode}` → `TelemetryDto` (mỗi ~2 giây)
- `/topic/alerts/{deviceCode}` → `AlertDto`
- `/topic/devices` → `DeviceDto` khi đổi trạng thái

### MQTT topics (deviceId = deviceCode)
- `pc/telemetry/{deviceId}` — PC Agent:
  `{"cpu_load":65.2,"cpu_temp":72.1,"cpu_clock_mhz":4600,"ram_usage":71.0,"ram_used_gb":11.4,"ram_total_gb":16,"gpu_load":88.0,"gpu_temp":70.3,"fan_speed_rpm":1650,"power_draw_w":320,"timestamp":"2026-10-18T09:00:00"}`
- `iot/environment/{deviceId}` — ESP32 (DHT22): `{"temperature":30.1,"humidity":62.5,"esp32_ip":"192.168.1.50","timestamp":"..."}`
- `pc/alerts/{deviceId}` — cảnh báo tức thì: `{"type":"FAN_FAILURE","message":"Quạt CPU ngừng quay","value":0}`
- `pc/control/{deviceId}` — backend → simulator: `{"scenario":"GAMING"}`

Backend nhận MQTT → đẩy vào RabbitMQ queue `telemetry.ingest.queue` → consumer: ghép dữ liệu môi trường mới nhất, lưu `telemetry_logs`, đánh giá BR09/BR10, broadcast WebSocket.

Kịch bản giả lập: IDLE (CPU ~5%, 42°C, phòng 28°C) · GAMING (CPU ~65%, 72°C, GPU ~95%, phòng 30°C) · STRESS (CPU 100%, 92°C, quạt 100%, phòng 41°C → báo động).

## 9. AI chẩn đoán

| Method | Path | Data |
|---|---|---|
| GET | `/api/ai/diagnostics/{deviceCode}` (auth) | `DiagnosticReport` (lần chạy gần nhất; nếu chưa có thì chạy ngay) |
| POST | `/api/ai/diagnostics/{deviceCode}/run` (auth) | `DiagnosticReport` (phân tích 30 ngày, lưu `ai_recommendations`) |
| POST | `/api/ai/recommendations/{id}/viewed` (auth) | `AiRecommendationDto` |
| POST | `/api/ai/recommendations/{id}/apply` (auth) | `AiRecommendationDto` (`isApplied=true`) |

```ts
DiagnosticReport = {
  deviceCode, deviceName, healthScore: 0..100, analyzedSamples, periodDays, generatedAt,
  metrics: { avgCpuLoad, p95CpuLoad, avgGpuLoad, avgRamUsage, ramOver88Ratio, maxCpuTemp, maxGpuTemp,
             avgCpuTemp, overheatRatio, peakPowerW, psuWattage, psuLoadRatio, maxFanRpm },
  findings: [{ bottleneckType, severity, diagnosticText }],
  recommendations: AiRecommendationDto[]
}
AiRecommendationDto = { id, bottleneckType, severity, diagnosticText, currentComponent: ProductDto|null,
                        recommendedProduct: ProductDto, expectedPerformanceGain, isViewed, isApplied, createdAt }
```
`bottleneckType`: `RAM_EXHAUSTION` (BR11) · `CPU_BOTTLENECK` (BR12) · `GPU_BOTTLENECK` · `THERMAL_THROTTLING` (BR13, đề xuất AIO) · `PSU_INSUFFICIENT` (peak power > 80% PSU).

## 10. Admin (`/api/admin/**` — chỉ ROLE_ADMIN, BR16)

| Method | Path | Body → Data |
|---|---|---|
| GET | `/api/admin/dashboard` | `AdminDashboardDto` |
| GET | `/api/admin/products?keyword=&category=&page=&size=` | `PageResponse<ProductDto>` (kể cả inactive) |
| POST | `/api/admin/products` | `ProductRequest` → `ProductDto` |
| PUT | `/api/admin/products/{id}` | `ProductRequest` → `ProductDto` |
| PATCH | `/api/admin/products/{id}/stock` | `{quantity: >0, note?}` (nhập thêm) → `ProductDto` |
| DELETE | `/api/admin/products/{id}` | soft delete (`isActive=false`) |
| GET | `/api/admin/orders?status=&keyword=&page=&size=` | `PageResponse<OrderDto>` |
| PATCH | `/api/admin/orders/{id}/status` | `{status}` → `OrderDto` (BR14: chỉ tiến 1 bước) |
| PATCH | `/api/admin/orders/{id}/payment` | `{paymentStatus}` → `OrderDto` |
| POST | `/api/admin/orders/{id}/cancel` | `{reason?}` → `OrderDto` (hoàn kho) |
| GET | `/api/admin/devices` | `DeviceDto[]` |
| GET | `/api/admin/alerts` | `AlertDto[]` 100 gần nhất |

```ts
ProductRequest = { categoryId, name, slug?, brand, price, originalPrice?, stockQuantity, warrantyMonths, imageUrl, images?: string[], description, isActive, specs?: ProductSpecDto }
AdminDashboardDto = {
  totalRevenue, monthRevenue, totalOrders, pendingOrders, lowStockCount, productsCount, customersCount,
  onlineDevices, totalDevices,
  revenueByDay:   [{ label: "dd/MM", revenue, orders }],   // 14 ngày gần nhất
  revenueByMonth: [{ label: "MM/yyyy", revenue, orders }], // 6 tháng
  categoryShare:  [{ name, value }],                       // doanh thu theo danh mục
  topProducts:    [{ productId, name, quantity, revenue }],
  recentAlerts:   AlertDto[], lowStockProducts: ProductDto[]
}
```
Doanh thu chỉ tính đơn `orderStatus != DA_HUY`.
