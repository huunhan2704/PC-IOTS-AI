# ĐỒ ÁN TỐT NGHIỆP: ỨNG DỤNG IOTS VÀ AI VÀO HỆ THỐNG WEB BÁN LINH KIỆN MÁY TÍNH

- **Tác giả:** Trần Hữu Nhân
- **Chuyên ngành:** Công nghệ Thông tin - Trường Đại học Tài nguyên và Môi trường TP.HCM (HCMUNRE)
- **Giảng viên hướng dẫn:** ThS. Nguyễn Thanh Truyền
- **Năm thực hiện:** 2026

---

## 🌟 Tổng Quan Đề Tài

Dự án là giải pháp thương mại điện tử công nghệ cao dành riêng cho ngành phần cứng máy tính, tích hợp 3 trụ cột kỹ thuật:

1. **E-Commerce & PC Builder:**
   - Hệ thống danh mục chuẩn công nghiệp (CPU, Mainboard, RAM, VGA, SSD, PSU, Cooler, Case).
   - Công cụ **PC Builder** tự động kiểm tra tương thích phần cứng 100% theo thời gian thực (Socket, chuẩn DDR, công suất nguồn an toàn $\ge 125\%$ TDP, kích thước VGA vs Case, Form Factor bo mạch chủ).
   - Đặt hàng an toàn chống bán âm kho với Redis Lock + Pessimistic Locking (`@Transactional`), hỗ trợ tạo mã VietQR Napas 247 chuẩn EMVCo tự động.

2. **Hệ Thống Giám Sát IoT Telemetry Thời Gian Thực:**
   - Thu thập chỉ số phần cứng PC (CPU Load %, RAM Usage %, GPU Temp, Fan RPM, Công suất Watt) qua agent PC.
   - Thu thập chỉ số môi trường phòng máy từ vi điều khiển **ESP32** (Nhiệt độ phòng, Độ ẩm không khí) qua giao thức **MQTT** (Mosquitto Broker).
   - Streaming dữ liệu trực tiếp lên giao diện Dashboard qua **Spring WebSocket (STOMP over SockJS)**.
   - Tự động kích hoạt cờ cảnh báo quá nhiệt (Overheat $\ge 85^\circ\text{C}$ liên tục 3 chu kỳ) và cảnh báo phòng nóng ($\ge 40^\circ\text{C}$).

3. **Trợ Lý AI Chuẩn Đoán & Khuyến Nghị Nâng Cấp:**
   - Phân tích chuỗi dữ liệu đo lường 30 ngày (Moving Average, 95th Percentile load).
   - Phát hiện chính xác điểm nghẽn hệ thống (Bottleneck):
     - **Nghẽn RAM (RAM Exhaustion):** Tần suất RAM Usage $> 88\%$ vượt quá $30\%$ thời gian.
     - **Nghẽn CPU (CPU Bottleneck):** CPU Load $> 95\%$ trong khi GPU Load $< 40\%$.
     - **Nghẽn GPU (GPU Bottleneck):** GPU Load $> 98\%$ trong khi CPU Load $< 50\%$.
     - **Suy giảm tản nhiệt (Thermal Throttling):** Nhiệt độ $> 88^\circ\text{C}$ kèm quạt quay tối đa.
     - **Nguy cơ quá tải nguồn (PSU Overload Risk):** Công suất đỉnh tiêu thụ $> 80\%$ công suất danh định PSU.
   - Tự động truy vấn CSDL đề xuất linh kiện thay thế tương thích 100% kèm tính năng **1-Click Thêm Tất Cả Vào Giỏ Hàng**.

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture & Tech Stack)

```
                     ┌──────────────────────────────────────────┐
                     │          React 18 + Tailwind SPA         │
                     │          (Vite / Port 5173/3000)         │
                     └──────┬────────────────────────────▲──────┘
                            │ REST API (JSON)            │ WebSocket (STOMP)
                            ▼                            │ /topic/telemetry/{id}
                     ┌───────────────────────────────────┴──────┐
                     │         Spring Boot 3.2 Backend          │
                     │           (Java 21 / Port 8080)          │
                     └──────┬────────────┬─────────────┬────────┘
                            │            │             │
              ┌─────────────▼──┐  ┌──────▼──────┐  ┌───▼───────────┐
              │ PostgreSQL 15  │  │   Redis 7   │  │  RabbitMQ 3   │
              │  (Port 5432)   │  │ (Port 6379) │  │  (Port 5672)  │
              └────────────────┘  └─────────────┘  └───▲───────────┘
                                                       │ Ingest Queue
                                                   ┌───┴───────────┐
                                                   │   Mosquitto   │
                                                   │  MQTT Broker  │
                                                   │  (Port 1883)  │
                                                   └───▲───────▲───┘
                                                       │       │
                                         pc/telemetry  │       │ iot/environment
                                                       │       │
                                                ┌──────┴─┐   ┌─┴─────────┐
                                                │ PC     │   │ ESP32     │
                                                │ Agent  │   │ Cảm biến  │
                                                │ Client │   │ Môi trường│
                                                └────────┘   └───────────┘
```

- **Backend:** Java 21, Spring Boot 3.2, Spring Security 6 + JWT Stateless, Spring Data JPA/Hibernate, Eclipse Paho MQTT Client, Spring WebSocket STOMP, Redis, RabbitMQ.
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS 3.4, Lucide-react, TanStack React Query v5, Zustand, Recharts, @stomp/stompjs, SockJS, VietQR SVG.
- **IoT Simulator:** Python 3 + `paho-mqtt` mô phỏng PC Client + ESP32 theo 3 kịch bản: `IDLE`, `GAMING`, `STRESS`.

---

## 📐 16 Quy Tắc Nghiệp Vụ (Business Rules BR01 - BR16)

| Mã | Tên quy tắc | Nội dung chi tiết |
|---|---|---|
| **BR01** | Socket CPU & Mainboard | Socket CPU phải trùng khớp chính xác với Socket Bo mạch chủ (LGA1700, AM5, AM4...). |
| **BR02** | Chuẩn RAM (RAM Gen) | Chuẩn RAM của Bo mạch chủ phải trùng với chuẩn thanh RAM (DDR4 không cắm được khe DDR5 và ngược lại). |
| **BR03** | Công suất nguồn an toàn | Công suất nguồn danh định $P_{PSU} \ge 1.25 \times \sum TDP_{components}$. |
| **BR04** | TDP Bộ tản nhiệt | Khả năng tản nhiệt $TDP_{Cooler} \ge TDP_{CPU}$. Cảnh báo nếu tiệm cận ngưỡng. |
| **BR05** | Form Factor Mainboard & Case | Kích thước Mainboard phải nằm trong danh sách Form Factor vỏ Case hỗ trợ. |
| **BR06** | Chiều dài VGA vs Khoảng trống Case | Chiều dài card VGA $\le$ Khoảng trống VGA tối đa của vỏ Case ($L_{GPU} \le L_{max\_Case}$). |
| **BR07** | Kiểm tra tồn kho thời gian thực | Khách hàng chỉ được mua số lượng $Q \le$ tồn kho hiện có. Khóa sản phẩm khi kiểm tra. |
| **BR08** | Giao dịch đặt hàng an toàn | Tạo đơn + Trừ kho nằm trong `@Transactional` + Redis Stock Gate + Pessimistic Lock, rollback ngay nếu thiếu hàng. |
| **BR09** | Cảnh báo quá nhiệt IoT | Nhiệt độ CPU/GPU $> 85^\circ\text{C}$ trong 3 chu kỳ liên tiếp $\rightarrow$ kích hoạt cờ `ALERT_OVERHEAT` và phát cảnh báo lên UI. |
| **BR10** | Cảnh báo môi trường phòng | Cảm biến ESP32 ghi nhận nhiệt độ phòng $> 40^\circ\text{C} \rightarrow$ phát cảnh báo `AMBIENT_HEAT`. |
| **BR11** | Chuẩn đoán nghẽn RAM | RAM Usage $> 88\%$ vượt $30\%$ thời lượng $\rightarrow$ AI đề xuất thanh RAM dung lượng cao hơn cùng chuẩn Mainboard. |
| **BR12** | Chuẩn đoán nghẽn CPU | CPU Load $> 95\%$ trong khi GPU Load $< 40\% \rightarrow$ AI đề xuất nâng cấp CPU cùng Socket có xung/nhân cao hơn. |
| **BR13** | Suy giảm hiệu năng tản nhiệt | Nhiệt độ $> 88^\circ\text{C}$ kèm quạt $100\%$ RPM $\rightarrow$ AI đề xuất bộ tản nhiệt nước AIO tương thích. |
| **BR14** | Vòng đời trạng thái đơn hàng | Chuyển một chiều: `CHO_XAC_NHAN` $\rightarrow$ `DA_XAC_NHAN` $\rightarrow$ `DANG_GIAO` $\rightarrow$ `DA_GIAO`. Hủy đơn hoàn kho tự động. |
| **BR15** | Sinh mã VietQR động | Thanh toán chuyển khoản tự động sinh mã VietQR Napas 247 chứa số tiền, số tài khoản và mã đơn hàng. |
| **BR16** | Phân quyền quản trị Admin | Các endpoint `/api/admin/**` chỉ cho phép tài khoản có vai trò `ROLE_ADMIN`. |

---

## 🖥️ 8 Form Giao Diện Chính Của Đồ Án (Section 5)

1. **`frm_TrangChu` (Trang chủ & Danh mục):** Header sticky kính mờ, Mega menu 8 danh mục, Autocomplete thông minh, bộ lọc facet filter đa chiều (Hãng, Giá slider, Socket, DDR), lưới sản phẩm chuẩn responsive.
2. **`frm_ChiTietLinhKien` (Chi tiết thông số):** Image gallery thumbnails, Ma trận thông số kỹ thuật (Specs Matrix), tiện ích kiểm tra tương thích nhanh (Quick Compatibility Checker), chính sách bảo hành và đánh giá.
3. **`frm_GioHang` (Quản lý giỏ hàng):** Bảng sản phẩm kiểm tra tồn kho realtime, áp dụng coupon (`NHAN10`, `IOTAI200K`, `FREESHIP`), tóm tắt chi phí tự động.
4. **`frm_ThanhToan` (Thanh toán đơn hàng):** Form thông tin giao hàng, COD hoặc VietQR Napas 247 hiển thị QR động kèm nút sao chép thông tin tiện lợi, trang đặt hàng thành công và tra cứu đơn hàng.
5. **`frm_DashboardIoT` (Bảng điều khiển IoT):** Đồng hồ đo phần cứng (CPU %, RAM %, GPU Temp, Fan RPM), chỉ số cảm biến phòng ESP32, biểu đồ streaming thời gian thực (Recharts), thanh công cụ chuyển đổi kịch bản giả lập (`IDLE`, `GAMING`, `STRESS`).
6. **`frm_TuVanAI` (AI chuẩn đoán & Gợi ý nâng cấp):** Vòng tròn điểm số sức khỏe phần cứng (Hardware Health Score /100), kết luận chẩn đoán bằng ngôn ngữ tự nhiên, thẻ so sánh linh kiện cũ $\rightarrow$ mới, nút **1-Click Thêm Tất Cả Vào Giỏ Hàng**.
7. **`frm_PCBuilder` (Xây dựng cấu hình PC):** Quy trình 8 bước linh kiện, bộ lọc thông minh tự động loại trừ linh kiện xung đột, tính tổng TDP và công suất nguồn khuyến nghị ($\ge 125\%$), hộp cảnh báo tương thích trực quan.
8. **`frm_AdminQuanTri` (Cổng quản trị hệ thống):** KPI tổng quan, biểu đồ doanh thu theo ngày/tháng, quản lý sản phẩm (thêm/sửa/nhập kho/xóa), quản lý đơn hàng (duyệt quy trình/hủy hoàn kho), quản lý đội thiết bị IoT.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Hệ Thống

### Cách 1: Khởi động toàn bộ bằng Docker Compose (Khuyên dùng)

Yêu cầu máy đã cài Docker Desktop. Chạy 1 lệnh duy nhất tại thư mục gốc:

```bash
docker compose up -d --build
```

Sau khi các container khởi động hoàn tất:
- **Web Ứng Dụng (Frontend):** http://localhost:3000 (hoặc http://localhost:5173 khi chạy dev)
- **RESTful API Backend:** http://localhost:8080/api
- **RabbitMQ Management UI:** http://localhost:15672 (tài khoản: `guest` / `guest`)
- **Mosquitto MQTT Broker:** `localhost:1883`

---

### Cách 2: Chạy độc lập trên máy phát triển (Local Development)

#### 1. Khởi chạy các dịch vụ nền tảng (PostgreSQL, Redis, RabbitMQ, Mosquitto)
Nếu có Docker, dùng file cấu hình rút gọn:
```bash
docker compose -f docker-compose.infra.yml up -d
```
Hoặc sử dụng PostgreSQL cục bộ:
- Tạo database: `linhkien_iotai`
- Chạy script CSDL: thực thi file `database/schema.sql` và `database/data.sql`.

#### 2. Chạy Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
```
*(Backend sẽ lắng nghe tại `http://localhost:8080`)*

#### 3. Chạy React Frontend
```bash
cd frontend
npm install
npm run dev
```
*(Frontend dev server mở tại `http://localhost:5173`)*

#### 4. Chạy Bộ Giả Lập IoT (Python)
Mở một cửa sổ dòng lệnh khác để chạy simulator:
```bash
cd iot-simulator
pip install -r requirements.txt
python simulator.py --scenario IDLE
```
*(Có thể đổi kịch bản trực tiếp trên giao diện Dashboard IoT hoặc qua tham số `--scenario GAMING` / `--scenario STRESS`)*

---

## 🔑 Tài Khoản Thử Nghiệm Có Sẵn (Demo Accounts)

| Vai trò | Tên đăng nhập | Mật khẩu | Mục đích sử dụng |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin` | `admin123` | Đăng nhập trang quản trị `/admin`, duyệt đơn hàng, quản lý kho linh kiện |
| **Khách hàng (Customer)** | `nhan` | `123456` | Khách hàng mẫu, sở hữu thiết bị IoT `PC-NHAN-001`, dùng PC Builder & AI |
| **Kỹ thuật viên (Technician)**| `tech` | `tech123` | Tài khoản kỹ thuật viên giám sát đội máy tính phòng lab |

---

## 📂 Cấu Trúc Mã Nguồn Monorepo

```
linhkien-iot-ai/
├── backend/                  # Mã nguồn Spring Boot 3.2 (Java 21)
│   ├── src/main/java/com/linhkien/iotai/
│   │   ├── config/           # Cấu hình Security, CORS, WebSocket, Redis, RabbitMQ, MQTT
│   │   ├── controller/       # REST Controllers (Auth, Product, Order, Builder, IoT, AI, Admin)
│   │   ├── dto/              # Data Transfer Objects chuẩn camelCase
│   │   ├── entity/           # JPA Entities (User, Product, Order, Telemetry, Recommendation...)
│   │   ├── repository/       # Spring Data JPA Repositories
│   │   ├── security/         # JWT Provider, Auth Filter, UserDetailsService
│   │   └── service/          # Service layer cài đặt 16 quy tắc nghiệp vụ BR01-BR16
│   └── src/main/resources/
│       ├── application.yml   # Cấu hình đa môi trường
│       ├── schema.sql        # Cấu trúc CSDL PostgreSQL
│       └── data.sql          # Dữ liệu mẫu phong phú (>30 linh kiện thật, lịch sử đo, đơn hàng)
├── frontend/                 # Mã nguồn React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/       # UI Components tái sử dụng (Header, Footer, Gauges, Modals...)
│   │   ├── pages/            # 8 Form màn hình chính của đồ án
│   │   ├── services/         # Axios API client & WebSocket STOMP hook
│   │   ├── store/            # Quản lý trạng thái toàn cục (Auth, Cart, PC Builder)
│   │   └── types/            # Khai báo TypeScript types chuẩn hợp đồng CONTRACT.md
├── iot-simulator/            # Bộ giả lập IoT PC Agent + ESP32 (Python paho-mqtt)
├── mosquitto/config/         # Cấu hình Eclipse Mosquitto MQTT Broker
├── database/                 # Bản sao lưu cấu trúc & dữ liệu CSDL
├── CONTRACT.md               # Hợp đồng giao tiếp kỹ thuật Backend <-> Frontend
├── docker-compose.yml        # Triển khai toàn bộ hệ thống bằng 1 lệnh
└── README.md                 # Tài liệu hướng dẫn đồ án
```
