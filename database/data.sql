-- ==============================================================================
-- SEED DATA: HỆ THỐNG WEB BÁN LINH KIỆN MÁY TÍNH TÍCH HỢP IOTS VÀ AI
-- Tác giả: Trần Hữu Nhân (HCMUNRE) - GVHD: ThS. Nguyễn Thanh Truyền
-- ==============================================================================

-- 1. USERS
-- admin / admin123
-- nhan / 123456
-- tech / tech123
INSERT INTO users (id, username, password_hash, full_name, email, phone, role, is_active, created_at)
VALUES 
(1, 'admin', '$2a$10$tXOwlfIZPnsEie3WykqpquBXzo2gfw3WwydlOseb2VlKWkzpzFCLi', 'Quản Trị Viên Hệ Thống', 'admin@linhkienioti.vn', '0901234567', 'ROLE_ADMIN', TRUE, NOW()),
(2, 'nhan', '$2a$10$LjF/DQHwakki0jsd6DxVU.7heWhosGl0vP5CpY.JS773DtwEinx2G', 'Trần Hữu Nhân', 'nhan.tran@student.hcmunre.edu.vn', '0912345678', 'ROLE_CUSTOMER', TRUE, NOW()),
(3, 'tech', '$2a$10$pkjjJJ8xkIJ0iLz5JtcDpuwf5oPcKH6kFccc1CPzNgJWNT5gr..ki', 'Kỹ Thuật Viên Lab IoT', 'tech@linhkienioti.vn', '0987654321', 'ROLE_TECHNICIAN', TRUE, NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. CATEGORIES (8 danh mục chính chuẩn đồ án)
INSERT INTO categories (id, name, slug, icon, description, display_order)
VALUES
(1, 'Vi xử lý (CPU)', 'cpu', 'Cpu', 'Bộ vi xử lý trung tâm Intel Core và AMD Ryzen thế hệ mới nhất', 1),
(2, 'Bo mạch chủ (Mainboard)', 'mainboard', 'CircuitBoard', 'Bo mạch chủ các dòng chipset Intel B760, Z790 và AMD B650, X670', 2),
(3, 'Bộ nhớ trong (RAM)', 'ram', 'MemoryStick', 'RAM máy tính để bàn chuẩn DDR4 và DDR5 hiệu năng cao', 3),
(4, 'Card màn hình (VGA)', 'vga', 'Gpu', 'Card đồ họa rời NVIDIA GeForce RTX 40 series và AMD Radeon RX', 4),
(5, 'Ổ cứng lưu trữ (SSD)', 'ssd', 'HardDrive', 'Ổ cứng thể rắn SSD chuẩn NVMe M.2 PCIe 4.0 và SATA 3', 5),
(6, 'Nguồn máy tính (PSU)', 'psu', 'PlugZap', 'Bộ nguồn công suất thực chuẩn 80 Plus Bronze, Gold, Platinum', 6),
(7, 'Tản nhiệt (Cooler)', 'cooler', 'Fan', 'Tản nhiệt khí tháp đôi và tản nhiệt nước AIO 240mm, 360mm', 7),
(8, 'Vỏ máy tính (Case)', 'case', 'Box', 'Vỏ case văn phòng, gaming hỗ trợ chuẩn main ATX, M-ATX, ITX', 8)
ON CONFLICT (id) DO NOTHING;

-- 3. PRODUCTS & SPECS
-- CPU
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(1, 1, 'Intel Core i5-12400F', 'intel-core-i5-12400f', 'Intel', 3190000, 3690000, 25, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Core+i5-12400F', 'Vi xử lý Intel Core i5 thế hệ 12, 6 nhân 12 luồng, xung nhịp lên tới 4.4GHz, không tích hợp iGPU, Socket LGA1700.', TRUE),
(2, 1, 'Intel Core i5-13400', 'intel-core-i5-13400', 'Intel', 5290000, 5890000, 18, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Core+i5-13400', 'Vi xử lý Intel Core i5 thế hệ 13, 10 nhân (6P+4E) 16 luồng, xung nhịp 4.6GHz, tích hợp Intel UHD 730, Socket LGA1700.', TRUE),
(3, 1, 'Intel Core i7-14700K', 'intel-core-i7-14700k', 'Intel', 10490000, 11500000, 12, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Core+i7-14700K', 'Vi xử lý Intel Core i7 thế hệ 14, 20 nhân (8P+12E) 28 luồng, xung nhịp Turbo 5.6GHz, mở khóa ép xung, Socket LGA1700.', TRUE),
(4, 1, 'AMD Ryzen 5 5600', 'amd-ryzen-5-5600', 'AMD', 2890000, 3290000, 15, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Ryzen+5+5600', 'Bộ vi xử lý AMD Ryzen 5 5600 kiến trúc Zen 3, 6 nhân 12 luồng, xung nhịp tối đa 4.4GHz, Socket AM4.', TRUE),
(5, 1, 'AMD Ryzen 5 7600X', 'amd-ryzen-5-7600x', 'AMD', 5490000, 6190000, 14, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Ryzen+5+7600X', 'Bộ vi xử lý AMD Ryzen 5 thế hệ 7000 Zen 4, 6 nhân 12 luồng, xung Boost 5.3GHz, Socket AM5, hỗ trợ DDR5 & PCIe 5.0.', TRUE),
(6, 1, 'AMD Ryzen 7 7800X3D', 'amd-ryzen-7-7800x3d', 'AMD', 10990000, 11990000, 8, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Ryzen+7+7800X3D', 'CPU Gaming hàng đầu thế giới với công nghệ 3D V-Cache 96MB, 8 nhân 16 luồng, Socket AM5.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (product_id, socket, ram_generation, tdp, cores, threads, base_clock, boost_clock, technical_json) VALUES
(1, 'LGA1700', 'DDR4,DDR5', 65, 6, 12, '2.5GHz', '4.4GHz', '{"SoNhan":6,"SoLuong":12,"Socket":"LGA1700","TDP":"65W","BoNhoDem":"18MB"}'),
(2, 'LGA1700', 'DDR4,DDR5', 65, 10, 16, '2.5GHz', '4.6GHz', '{"SoNhan":10,"SoLuong":16,"Socket":"LGA1700","TDP":"65W","BoNhoDem":"20MB"}'),
(3, 'LGA1700', 'DDR4,DDR5', 125, 20, 28, '3.4GHz', '5.6GHz', '{"SoNhan":20,"SoLuong":28,"Socket":"LGA1700","TDP":"125W","MaxTurboPower":"253W"}'),
(4, 'AM4', 'DDR4', 65, 6, 12, '3.5GHz', '4.4GHz', '{"SoNhan":6,"SoLuong":12,"Socket":"AM4","TDP":"65W","BoNhoDem":"32MB"}'),
(5, 'AM5', 'DDR5', 105, 6, 12, '4.7GHz', '5.3GHz', '{"SoNhan":6,"SoLuong":12,"Socket":"AM5","TDP":"105W","BoNhoDem":"32MB"}'),
(6, 'AM5', 'DDR5', 120, 8, 16, '4.2GHz', '5.0GHz', '{"SoNhan":8,"SoLuong":16,"Socket":"AM5","TDP":"120W","BoNhoDem":"96MB 3D V-Cache"}')
ON CONFLICT (product_id) DO NOTHING;

-- MAINBOARDS
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(7, 2, 'ASUS TUF GAMING B760M-PLUS WIFI D4', 'asus-tuf-gaming-b760m-plus-wifi-d4', 'ASUS', 3890000, 4290000, 20, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=ASUS+B760M+D4', 'Bo mạch chủ Micro-ATX Socket LGA1700, hỗ trợ RAM DDR4, tích hợp Wi-Fi 6, 2 khe M.2 PCIe 4.0.', TRUE),
(8, 2, 'MSI PRO B760M-A WIFI DDR5', 'msi-pro-b760m-a-wifi-ddr5', 'MSI', 4190000, 4690000, 16, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=MSI+B760M+D5', 'Bo mạch chủ Micro-ATX cho Intel Gen 12/13/14, hỗ trợ RAM DDR5 Bus 6800+ OC, Wi-Fi 6E, tản nhiệt VRM dày dặn.', TRUE),
(9, 2, 'ASUS ROG STRIX Z790-E GAMING WIFI DDR5', 'asus-rog-strix-z790-e-gaming-wifi', 'ASUS', 11990000, 13200000, 6, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=ROG+Z790-E+D5', 'Bo mạch chủ cao cấp chuẩn ATX, 18+1 Phase nguồn 90A, PCIe 5.0 x16 & M.2 PCIe 5.0, Wi-Fi 6E, âm thanh SupremeFX.', TRUE),
(10, 2, 'Gigabyte B550M AORUS ELITE DDR4', 'gigabyte-b550m-aorus-elite', 'Gigabyte', 2490000, 2790000, 12, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Giga+B550M+D4', 'Bo mạch chủ Micro-ATX Socket AM4 cho AMD Ryzen 5000 series, 4 khe RAM DDR4, PCIe 4.0 x16.', TRUE),
(11, 2, 'MSI MAG B650M MORTAR WIFI DDR5', 'msi-mag-b650m-mortar-wifi', 'MSI', 4690000, 5190000, 14, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=MSI+B650M+Mortar', 'Bo mạch chủ AM5 cho Ryzen 7000/8000, hỗ trợ DDR5 EXPO, 2.5G LAN + Wi-Fi 6E, 12+2+1 Phase nguồn.', TRUE),
(12, 2, 'ASUS ROG STRIX B650-A GAMING WIFI ATX', 'asus-rog-strix-b650-a-gaming-wifi', 'ASUS', 6390000, 6990000, 8, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=ROG+B650-A+ATX', 'Bo mạch chủ ATX màu trắng bạc tuyệt đẹp, PCIe 5.0 M.2, USB 3.2 Gen 2x2 Type-C, Wi-Fi 6E.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (product_id, socket, ram_generation, form_factor, tdp, technical_json) VALUES
(7, 'LGA1700', 'DDR4', 'Micro-ATX', 20, '{"Chipset":"Intel B760","KichThuoc":"Micro-ATX","KheRAM":4,"ChuanRAM":"DDR4","Wifi":"Wi-Fi 6"}'),
(8, 'LGA1700', 'DDR5', 'Micro-ATX', 20, '{"Chipset":"Intel B760","KichThuoc":"Micro-ATX","KheRAM":4,"ChuanRAM":"DDR5","Wifi":"Wi-Fi 6E"}'),
(9, 'LGA1700', 'DDR5', 'ATX', 30, '{"Chipset":"Intel Z790","KichThuoc":"ATX","KheRAM":4,"ChuanRAM":"DDR5","PCIe5":"Co"}'),
(10, 'AM4', 'DDR4', 'Micro-ATX', 15, '{"Chipset":"AMD B550","KichThuoc":"Micro-ATX","KheRAM":4,"ChuanRAM":"DDR4"}'),
(11, 'AM5', 'DDR5', 'Micro-ATX', 20, '{"Chipset":"AMD B650","KichThuoc":"Micro-ATX","KheRAM":4,"ChuanRAM":"DDR5","Wifi":"Wi-Fi 6E"}'),
(12, 'AM5', 'DDR5', 'ATX', 25, '{"Chipset":"AMD B650","KichThuoc":"ATX","KheRAM":4,"ChuanRAM":"DDR5","MauSac":"Trang"}')
ON CONFLICT (product_id) DO NOTHING;

-- RAM
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(13, 3, 'Corsair Vengeance LPX 16GB (1x16GB) DDR4 3200MHz', 'corsair-vengeance-lpx-16gb-ddr4-3200', 'Corsair', 890000, 1050000, 45, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Corsair+16GB+D4', 'Thanh nhớ RAM DDR4 tản nhiệt nhôm đen nhỏ gọn, Bus 3200MHz CL16, hỗ trợ Intel XMP 2.0.', TRUE),
(14, 3, 'Corsair Vengeance LPX 32GB (2x16GB) DDR4 3200MHz', 'corsair-vengeance-lpx-32gb-ddr4-3200', 'Corsair', 1690000, 1990000, 25, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Corsair+32GB+D4', 'Kit 2 thanh 16GB tổng dung lượng 32GB DDR4 3200MHz, lý tưởng nâng cấp giải quyết tràn RAM khi đa nhiệm.', TRUE),
(15, 3, 'Kingston Fury Beast 16GB (1x16GB) DDR5 5600MHz', 'kingston-fury-beast-16gb-ddr5-5600', 'Kingston', 1290000, 1490000, 30, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Kingston+16GB+D5', 'RAM chuẩn DDR5 thế hệ mới, Bus 5600MHz CL36, tích hợp On-die ECC tăng tính ổn định.', TRUE),
(16, 3, 'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6000MHz', 'gskill-trident-z5-rgb-32gb-ddr5-6000', 'G.Skill', 3190000, 3590000, 18, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=GSkill+32GB+D5', 'Kit RAM DDR5 hiệu năng cao cực đẹp với dải LED RGB mượt mà, Bus 6000MHz CL30 tối ưu cho cả Intel XMP & AMD EXPO.', TRUE),
(17, 3, 'Corsair Vengeance 64GB (2x32GB) DDR5 6000MHz', 'corsair-vengeance-64gb-ddr5-6000', 'Corsair', 5890000, 6500000, 10, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Corsair+64GB+D5', 'Dung lượng khủng 64GB DDR5 cho đồ họa 3D, dựng phim và máy ảo chuyên nghiệp.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (product_id, ram_generation, ram_bus, capacity_gb, tdp, technical_json) VALUES
(13, 'DDR4', 3200, 16, 5, '{"Chuan":"DDR4","DungLuong":"16GB","Bus":"3200MHz","DoTre":"CL16","TanNhiet":"Nhom"}'),
(14, 'DDR4', 3200, 32, 10, '{"Chuan":"DDR4","DungLuong":"32GB (2x16GB)","Bus":"3200MHz","DoTre":"CL16"}'),
(15, 'DDR5', 5600, 16, 5, '{"Chuan":"DDR5","DungLuong":"16GB","Bus":"5600MHz","DoTre":"CL36","OnDieECC":"Co"}'),
(16, 'DDR5', 6000, 32, 10, '{"Chuan":"DDR5","DungLuong":"32GB (2x16GB)","Bus":"6000MHz","DoTre":"CL30","RGB":"Co"}'),
(17, 'DDR5', 6000, 64, 15, '{"Chuan":"DDR5","DungLuong":"64GB (2x32GB)","Bus":"6000MHz","DoTre":"CL30"}')
ON CONFLICT (product_id) DO NOTHING;

-- VGA
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(18, 4, 'ASUS Dual GeForce RTX 4060 OC 8GB', 'asus-dual-geforce-rtx-4060-oc-8gb', 'ASUS', 8490000, 9290000, 15, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=ASUS+RTX+4060', 'Card đồ họa NVIDIA GeForce RTX 4060 8GB GDDR6, kiến trúc Ada Lovelace, DLSS 3, 2 quạt làm mát Axial-tech, dài 227mm.', TRUE),
(19, 4, 'MSI GeForce RTX 4060 Ti VENTUS 2X BLACK 8G OC', 'msi-geforce-rtx-4060-ti-ventus-2x-8g', 'MSI', 10990000, 11990000, 10, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=MSI+RTX+4060Ti', 'Card đồ họa kiến trúc Ada Lovelace, DLSS 3, thiết kế tối giản đen tuyền, 2 quạt TORX Fan 4.0, dài 199mm.', TRUE),
(20, 4, 'GIGABYTE GeForce RTX 4070 SUPER WINDFORCE OC 12G', 'gigabyte-rtx-4070-super-windforce-oc-12g', 'Gigabyte', 17490000, 18990000, 8, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Giga+RTX+4070S', 'VGA RTX 4070 SUPER 12GB GDDR6X, hệ thống tản nhiệt 3 quạt WINDFORCE, hiệu năng vượt trội cho độ phân giải 2K.', TRUE),
(21, 4, 'ASUS TUF Gaming GeForce RTX 4080 SUPER 16GB', 'asus-tuf-rtx-4080-super-16gb', 'ASUS', 28990000, 31500000, 4, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=TUF+RTX+4080S', 'Quái vật đồ họa 4K gaming, khung kim loại TUF cứng cáp, quạt vòng bi kép, dài 348mm.', TRUE),
(22, 4, 'Sapphire PULSE Radeon RX 7600 8GB', 'sapphire-pulse-radeon-rx-7600-8gb', 'Sapphire', 6990000, 7590000, 12, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=RX+7600+8GB', 'Card đồ họa AMD Radeon RX 7600 kiến trúc RDNA 3, hỗ trợ FSR 3, tản nhiệt Dual-X êm ái.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (product_id, vram, tdp, gpu_length_mm, technical_json) VALUES
(18, 8, 115, 227, '{"ChipDoHoa":"RTX 4060","VRAM":"8GB GDDR6","TDP":"115W","ChieuDai":"227mm","CongXuatNguonDeXuat":"550W"}'),
(19, 8, 160, 199, '{"ChipDoHoa":"RTX 4060 Ti","VRAM":"8GB GDDR6","TDP":"160W","ChieuDai":"199mm","CongXuatNguonDeXuat":"550W"}'),
(20, 12, 220, 261, '{"ChipDoHoa":"RTX 4070 SUPER","VRAM":"12GB GDDR6X","TDP":"220W","ChieuDai":"261mm","CongXuatNguonDeXuat":"650W"}'),
(21, 16, 320, 348, '{"ChipDoHoa":"RTX 4080 SUPER","VRAM":"16GB GDDR6X","TDP":"320W","ChieuDai":"348mm","CongXuatNguonDeXuat":"750W"}'),
(22, 8, 165, 240, '{"ChipDoHoa":"Radeon RX 7600","VRAM":"8GB GDDR6","TDP":"165W","ChieuDai":"240mm","CongXuatNguonDeXuat":"550W"}')
ON CONFLICT (product_id) DO NOTHING;

-- SSD
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(23, 5, 'Samsung 990 PRO 1TB PCIe 4.0 NVMe M.2', 'samsung-990-pro-1tb-pcie-4-nvme', 'Samsung', 2790000, 3190000, 25, 60, 'https://placehold.co/600x600/0f172a/38bdf8?text=Samsung+990+PRO', 'Ổ cứng SSD NVMe đỉnh cao với tốc độ đọc lên tới 7450 MB/s, ghi 6900 MB/s, độ bền cao 600 TBW.', TRUE),
(24, 5, 'Kingston NV2 500GB PCIe 4.0 NVMe M.2', 'kingston-nv2-500gb-pcie-4-nvme', 'Kingston', 1090000, 1250000, 40, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Kingston+NV2+500G', 'Giải pháp lưu trữ NVMe Gen 4x4 kinh tế, đọc 3500 MB/s, ghi 2100 MB/s, dung lượng 500GB.', TRUE),
(25, 5, 'WD Blue SN580 1TB PCIe Gen4 NVMe M.2', 'wd-blue-sn580-1tb-pcie-gen4-nvme', 'Western Digital', 1890000, 2190000, 30, 60, 'https://placehold.co/600x600/0f172a/38bdf8?text=WD+Blue+1TB', 'Ổ cứng SSD WD Blue SN580 trang bị công nghệ nCache 4.0, đọc ghi 4150 MB/s cực kỳ mát mẻ.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (product_id, storage_interface, capacity_gb, tdp, technical_json) VALUES
(23, 'PCIe 4.0 NVMe M.2', 1000, 8, '{"KichThuoc":"M.2 2280","TocDoDoc":"7450 MB/s","TocDoGhi":"6900 MB/s","TBW":600}'),
(24, 'PCIe 4.0 NVMe M.2', 500, 5, '{"KichThuoc":"M.2 2280","TocDoDoc":"3500 MB/s","TocDoGhi":"2100 MB/s"}'),
(25, 'PCIe 4.0 NVMe M.2', 1000, 6, '{"KichThuoc":"M.2 2280","TocDoDoc":"4150 MB/s","TocDoGhi":"4150 MB/s"}')
ON CONFLICT (product_id) DO NOTHING;

-- PSU (Nguồn)
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(26, 6, 'Corsair CV550 550W 80 Plus Bronze', 'corsair-cv550-550w-80-plus-bronze', 'Corsair', 1190000, 1350000, 25, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=Corsair+CV550', 'Bộ nguồn công suất thực 550W chuẩn 80 Plus Bronze, quạt 120mm điều tốc thông minh.', TRUE),
(27, 6, 'MSI MAG A750GL PCIE5 750W 80 Plus Gold', 'msi-mag-a750gl-pcie5-750w-gold', 'MSI', 2490000, 2890000, 18, 60, 'https://placehold.co/600x600/0f172a/38bdf8?text=MSI+750W+Gold', 'Nguồn Full Modular chuẩn ATX 3.0 & PCIe 5.0 với dây cáp 16-pin 12VHPWR cho RTX 40 series, 80 Plus Gold.', TRUE),
(28, 6, 'Corsair RM850e 850W 80 Plus Gold ATX 3.0', 'corsair-rm850e-850w-80-plus-gold', 'Corsair', 3290000, 3690000, 15, 84, 'https://placehold.co/600x600/0f172a/38bdf8?text=Corsair+RM850e', 'Nguồn Corsair RM850e chuẩn ATX 3.0, dây rời toàn bộ, tụ điện chuẩn công nghiệp 105°C, 80 Plus Gold.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (product_id, psu_wattage, psu_efficiency, tdp, technical_json) VALUES
(26, 550, '80 Plus Bronze', 0, '{"CongSuat":"550W","HieuSuat":"80 Plus Bronze","CapNguon":"Day lien","BaoHanh":"36 thang"}'),
(27, 750, '80 Plus Gold', 0, '{"CongSuat":"750W","HieuSuat":"80 Plus Gold","ATX30":"Co","FullModular":"Co"}'),
(28, 850, '80 Plus Gold', 0, '{"CongSuat":"850W","HieuSuat":"80 Plus Gold","ATX30":"Co","FullModular":"Co"}')
ON CONFLICT (product_id) DO NOTHING;

-- Tản nhiệt (Cooler)
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(29, 7, 'Deepcool AG400 ARGB', 'deepcool-ag400-argb', 'Deepcool', 450000, 550000, 35, 24, 'https://placehold.co/600x600/0f172a/38bdf8?text=Deepcool+AG400', 'Tản nhiệt khí đơn 4 ống đồng, quạt 120mm LED ARGB, khả năng giải nhiệt lên tới 150W TDP.', TRUE),
(30, 7, 'Deepcool AK400 Digital', 'deepcool-ak400-digital', 'Deepcool', 890000, 1050000, 20, 24, 'https://placehold.co/600x600/0f172a/38bdf8?text=AK400+Digital', 'Tản nhiệt khí với màn hình LED hiển thị nhiệt độ và mức độ sử dụng CPU thời gian thực, TDP 220W.', TRUE),
(31, 7, 'Deepcool LS520 SE 240mm AIO', 'deepcool-ls520-se-240mm-aio', 'Deepcool', 1990000, 2350000, 14, 36, 'https://placehold.co/600x600/0f172a/38bdf8?text=LS520+AIO+240', 'Tản nhiệt nước AIO 240mm bơm thế hệ thứ 4 mạnh mẽ, 2 quạt ARGB, giải nhiệt tối đa 260W TDP.', TRUE),
(32, 7, 'NZXT Kraken 360 RGB', 'nzxt-kraken-360-rgb', 'NZXT', 5490000, 5990000, 6, 72, 'https://placehold.co/600x600/0f172a/38bdf8?text=NZXT+Kraken+360', 'Tản nhiệt nước cao cấp radiator 360mm với màn hình LCD hiển thị ảnh động/thông số hệ thống, TDP 300W+.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (product_id, cooling_type, cooler_tdp_rating, tdp, technical_json) VALUES
(29, 'Air Cooler', 150, 4, '{"LoaiTan":"Tan khi","OngDong":4,"Quat":"120mm ARGB","TDPDeXuat":"150W"}'),
(30, 'Air Cooler', 220, 5, '{"LoaiTan":"Tan khi","ManHinhLED":"Co","TDPDeXuat":"220W"}'),
(31, 'AIO 240mm', 260, 15, '{"LoaiTan":"AIO Nuoc","Radiator":"240mm","TDPDeXuat":"260W"}'),
(32, 'AIO 360mm', 320, 20, '{"LoaiTan":"AIO Nuoc","Radiator":"360mm","ManHinhLCD":"1.54 inch","TDPDeXuat":"320W"}')
ON CONFLICT (product_id) DO NOTHING;

-- Vỏ máy tính (Case)
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(33, 8, 'Xigmatek NYX 3F M-ATX', 'xigmatek-nyx-3f-m-atx', 'Xigmatek', 690000, 790000, 22, 12, 'https://placehold.co/600x600/0f172a/38bdf8?text=Xigmatek+NYX', 'Vỏ case Micro-ATX nhỏ gọn, mặt kính cường lực, kèm sẵn 3 quạt RGB, hỗ trợ VGA dài 320mm.', TRUE),
(34, 8, 'NZXT H5 Flow Matte Black', 'nzxt-h5-flow-matte-black', 'NZXT', 2190000, 2490000, 15, 24, 'https://placehold.co/600x600/0f172a/38bdf8?text=NZXT+H5+Flow', 'Vỏ case ATX luồng khí tối ưu, mặt lưới đục lỗ, quạt chuyên dụng làm mát VGA ở đáy, VGA tối đa 365mm.', TRUE),
(35, 8, 'Lian Li O11 Dynamic EVO Black', 'lian-li-o11-dynamic-evo-black', 'Lian Li', 3990000, 4490000, 8, 12, 'https://placehold.co/600x600/0f172a/38bdf8?text=Lian+Li+O11D', 'Case bể cá 2 mặt kính cường lực chuẩn ATX/E-ATX, khoang nguồn kép, hỗ trợ VGA khủng 422mm và tản AIO 360mm.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (product_id, form_factor, supported_form_factors, max_gpu_length_mm, tdp, technical_json) VALUES
(33, 'Micro-ATX', 'Micro-ATX,Mini-ITX', 320, 0, '{"MainboardHoTro":"Micro-ATX, Mini-ITX","VGAChieuDaiToiDa":"320mm","QuatKemTheo":3}'),
(34, 'ATX', 'ATX,Micro-ATX,Mini-ITX', 365, 0, '{"MainboardHoTro":"ATX, Micro-ATX, Mini-ITX","VGAChieuDaiToiDa":"365mm","TanNuocHoTro":"280mm, 240mm"}'),
(35, 'ATX', 'E-ATX,ATX,Micro-ATX,Mini-ITX', 422, 0, '{"MainboardHoTro":"E-ATX, ATX, Micro-ATX","VGAChieuDaiToiDa":"422mm","TanNuocHoTro":"360mm"}')
ON CONFLICT (product_id) DO NOTHING;

-- 4. PRODUCT IMAGES (Mỗi sản phẩm có 3 ảnh)
INSERT INTO product_images (product_id, image_url, sort_order)
SELECT p.id, 'https://placehold.co/600x600/0f172a/38bdf8?text=' || p.slug || '-front', 1 FROM products p
UNION ALL
SELECT p.id, 'https://placehold.co/600x600/1e293b/38bdf8?text=' || p.slug || '-side', 2 FROM products p
UNION ALL
SELECT p.id, 'https://placehold.co/600x600/0f172a/f43f5e?text=' || p.slug || '-box', 3 FROM products p
ON CONFLICT DO NOTHING;

-- 5. COUPONS
INSERT INTO coupons (code, description, discount_type, discount_value, max_discount, min_order, is_active)
VALUES
('NHAN10', 'Giảm 10% tối đa 500.000đ nhân dịp ra mắt đồ án', 'PERCENT', 10, 500000, 1000000, TRUE),
('IOTAI200K', 'Giảm thẳng 200.000đ cho đơn hàng linh kiện từ 3.000.000đ', 'FIXED', 200000, 200000, 3000000, TRUE),
('FREESHIP', 'Miễn phí vận chuyển toàn quốc cho đơn từ 2.000.000đ', 'FREESHIP', 40000, 40000, 2000000, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 6. IOT DEVICES
-- Cấu hình PC-NHAN-001 yếu RAM (16GB), tản khí nhỏ AG400, nguồn 550W để AI dễ phát hiện điểm nghẽn
INSERT INTO iot_devices (id, user_id, device_code, device_name, mac_address, status, esp32_ip, room_location, last_ping, current_scenario, current_cpu_id, current_mainboard_id, current_ram_id, current_gpu_id, current_psu_id, current_cooler_id, created_at)
VALUES
(1, 2, 'PC-NHAN-001', 'PC Gaming Trần Hữu Nhân', 'E4:5F:01:23:45:67', 'ONLINE', '192.168.1.105', 'Phòng ngủ - Q.Bình Thạnh, TP.HCM', NOW(), 'IDLE', 1, 7, 13, 18, 26, 29, NOW() - INTERVAL '30 days'),
(2, 1, 'PC-LAB-002', 'Máy Trạm Lab IoT & AI', 'B8:27:EB:9A:BC:DE', 'ONLINE', '192.168.1.188', 'Lab CNTT - Đại học TNMT TP.HCM', NOW(), 'IDLE', 3, 9, 16, 21, 28, 32, NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- 7. REVIEWS
INSERT INTO reviews (product_id, user_id, rating, comment, created_at) VALUES
(1, 2, 5, 'Core i5-12400F chạy cực êm và mát, trong tầm giá 3 triệu là sự lựa chọn số 1.', NOW() - INTERVAL '5 days'),
(18, 2, 5, 'RTX 4060 chiến game Full HD max setting không có gì phải chê, ăn rất ít điện.', NOW() - INTERVAL '3 days'),
(7, 2, 4, 'Main ASUS B760M Plus WiFi cứng cáp, bắt sóng wifi rất khỏe.', NOW() - INTERVAL '2 days'),
(16, 1, 5, 'Trident Z5 RGB DDR5 6000MHz quá đẹp, bật EXPO nhận ngay lập tức.', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- 8. SEED TELEMETRY (Lịch sử đo phục vụ AI chuẩn đoán BR11, BR12, BR13)
-- Tạo 100 mẫu dữ liệu lịch sử cho PC-NHAN-001
INSERT INTO telemetry_logs (device_id, cpu_load, cpu_temp, cpu_clock_mhz, ram_usage, ram_used_gb, ram_total_gb, gpu_load, gpu_temp, fan_speed_rpm, power_draw_w, ambient_temp, ambient_humidity, status_flag, recorded_at)
SELECT 
    1,
    -- CPU load dao động 60 - 98%
    ROUND((60 + (random() * 38))::numeric, 1),
    -- Nhiệt độ CPU: một số đợt tiệm cận 88 - 92 độ C
    ROUND((65 + (random() * 26))::numeric, 1),
    4200,
    -- RAM Usage thường xuyên > 88% để kích hoạt BR11
    ROUND((85 + (random() * 12))::numeric, 1),
    ROUND((16.0 * (85 + (random() * 12)) / 100)::numeric, 2),
    16.0,
    ROUND((75 + (random() * 24))::numeric, 1),
    ROUND((68 + (random() * 15))::numeric, 1),
    -- Quạt quay 1800 - 2400 RPM
    1800 + CAST(random() * 600 AS INT),
    320 + CAST(random() * 120 AS INT),
    ROUND((28 + (random() * 5))::numeric, 1),
    ROUND((58 + (random() * 10))::numeric, 1),
    'NORMAL',
    NOW() - (s.i || ' hours')::interval
FROM generate_series(1, 100) AS s(i)
WHERE NOT EXISTS (SELECT 1 FROM telemetry_logs WHERE device_id = 1 LIMIT 1);

-- 9. SEED ORDERS
INSERT INTO orders (id, order_code, user_id, customer_name, phone, shipping_address, city, payment_method, payment_status, order_status, total_amount, discount_amount, coupon_code, shipping_fee, final_amount, note, created_at) VALUES
(1, 'LK261015A01', 2, 'Trần Hữu Nhân', '0912345678', '236 Lê Văn Sỹ, Phường 1', 'TP. Hồ Chí Minh', 'BANK_TRANSFER_QR', 'PAID', 'DA_GIAO', 12570000, 200000, 'IOTAI200K', 0, 12370000, 'Giao giờ hành chính', NOW() - INTERVAL '10 days'),
(2, 'LK261016B02', 2, 'Trần Hữu Nhân', '0912345678', '236 Lê Văn Sỹ, Phường 1', 'TP. Hồ Chí Minh', 'COD', 'UNPAID', 'DANG_GIAO', 3890000, 0, NULL, 0, 3890000, 'Gọi trước khi giao', NOW() - INTERVAL '2 days'),
(3, 'LK261018C03', 2, 'Trần Hữu Nhân', '0912345678', '236 Lê Văn Sỹ, Phường 1', 'TP. Hồ Chí Minh', 'BANK_TRANSFER_QR', 'UNPAID', 'CHO_XAC_NHAN', 8490000, 500000, 'NHAN10', 0, 7990000, 'Đang chuẩn bị chuyển khoản', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal) VALUES
(1, 1, 'Intel Core i5-12400F', 3190000, 1, 3190000),
(1, 7, 'ASUS TUF GAMING B760M-PLUS WIFI D4', 3890000, 1, 3890000),
(1, 13, 'Corsair Vengeance LPX 16GB (1x16GB) DDR4 3200MHz', 890000, 1, 890000),
(1, 29, 'Deepcool AG400 ARGB', 450000, 1, 450000),
(1, 23, 'Samsung 990 PRO 1TB PCIe 4.0 NVMe M.2', 2790000, 1, 2790000),
(1, 26, 'Corsair CV550 550W 80 Plus Bronze', 1190000, 1, 1190000),
(2, 7, 'ASUS TUF GAMING B760M-PLUS WIFI D4', 3890000, 1, 3890000),
(3, 18, 'ASUS Dual GeForce RTX 4060 OC 8GB', 8490000, 1, 8490000)
ON CONFLICT DO NOTHING;

-- Reset sequences
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products));
SELECT setval('product_images_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_images));
SELECT setval('product_specs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_specs));
SELECT setval('reviews_id_seq', (SELECT COALESCE(MAX(id), 1) FROM reviews));
SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM orders));
SELECT setval('order_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM order_items));
SELECT setval('iot_devices_id_seq', (SELECT COALESCE(MAX(id), 1) FROM iot_devices));
SELECT setval('telemetry_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM telemetry_logs));
