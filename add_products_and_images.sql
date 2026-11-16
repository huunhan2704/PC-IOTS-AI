-- Cập nhật hình ảnh chất lượng cao, đúng linh kiện thật (Unsplash / Hardware Tech CDN)
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80' WHERE id IN (1, 2, 3); -- CPU Intel Core
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&auto=format&fit=crop&q=80' WHERE id IN (4, 5, 6); -- CPU AMD Ryzen
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80' WHERE id IN (7, 8, 9, 10, 11, 12); -- Mainboards
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80' WHERE id IN (13, 14, 15, 16, 17); -- RAM DDR4, DDR5
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80' WHERE id IN (18, 19, 20, 21, 22); -- VGA / Card đồ họa
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80' WHERE id IN (23, 24, 25); -- Ổ cứng SSD M.2 NVMe
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&auto=format&fit=crop&q=80' WHERE id IN (26, 27, 28); -- Nguồn PSU
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1618764400608-9e7115eacf74?w=600&auto=format&fit=crop&q=80' WHERE id IN (29, 30, 31, 32); -- Tản nhiệt Cooler / AIO
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?w=600&auto=format&fit=crop&q=80' WHERE id IN (33, 34, 35); -- Vỏ case PC

-- THÊM 20 SẢN PHẨM MỚI (ID 36 -> 55) KÈM THÔNG SỐ PRODUCT_SPECS CHUẨN ĐỒ ÁN
-- Danh mục:
-- 1: CPU, 2: Mainboard, 3: RAM, 4: VGA, 5: SSD, 6: PSU, 7: Cooler, 8: Case

-- === CPU (1) ===
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(36, 1, 'Intel Core i9-14900K', 'intel-core-i9-14900k', 'Intel', 14990000, 16500000, 10, 36, 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80', 'Flagship Intel Core i9 Gen 14, 24 nhân (8P+16E) 32 luồng, xung nhịp khủng 6.0GHz, Socket LGA1700.', TRUE),
(37, 1, 'AMD Ryzen 9 7950X', 'amd-ryzen-9-7950x', 'AMD', 13990000, 15500000, 8, 36, 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&auto=format&fit=crop&q=80', 'Bộ vi xử lý đồ họa cao cấp 16 nhân 32 luồng Zen 4, xung Boost 5.7GHz, Socket AM5, TDP 170W.', TRUE),
(38, 1, 'Intel Core i3-12100F', 'intel-core-i3-12100f', 'Intel', 2190000, 2490000, 30, 36, 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80', 'CPU quốc dân phân khúc phổ thông giá rẻ, 4 nhân 8 luồng, xung 4.3GHz, Socket LGA1700, TDP 58W.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (id, product_id, socket, ram_generation, tdp, cores, threads, base_clock, boost_clock, technical_json) VALUES
(36, 36, 'LGA1700', 'DDR4,DDR5', 125, 24, 32, '3.2GHz', '6.0GHz', '{"SoNhan":24,"SoLuong":32,"Socket":"LGA1700","TDP":"125W","MaxTurbo":"253W"}'),
(37, 37, 'AM5', 'DDR5', 170, 16, 32, '4.5GHz', '5.7GHz', '{"SoNhan":16,"SoLuong":32,"Socket":"AM5","TDP":"170W","Cache":"80MB"}'),
(38, 38, 'LGA1700', 'DDR4,DDR5', 58, 4, 8, '3.3GHz', '4.3GHz', '{"SoNhan":4,"SoLuong":8,"Socket":"LGA1700","TDP":"58W","BoNhoDem":"12MB"}')
ON CONFLICT (id) DO NOTHING;

-- === MAINBOARD (2) ===
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(39, 2, 'ASRock B760M Pro RS/D4', 'asrock-b760m-pro-rs-d4', 'ASRock', 2990000, 3350000, 20, 36, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80', 'Bo mạch chủ M-ATX giá tốt hỗ trợ Intel Gen 12/13/14, 4 khe RAM DDR4, PCIe 4.0, tản VRM mát mẻ.', TRUE),
(40, 2, 'Gigabyte Z790 AORUS ELITE AX DDR5', 'gigabyte-z790-aorus-elite-ax-d5', 'GIGABYTE', 6890000, 7590000, 12, 36, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80', 'Bo mạch chủ chuẩn ATX ép xung chuyên nghiệp Intel Z790, Wi-Fi 6E, 4 khe RAM DDR5 7600+ MHz.', TRUE),
(41, 2, 'ASRock B650M-HDV/M.2 DDR5', 'asrock-b650m-hdv-m2-d5', 'ASRock', 3190000, 3590000, 18, 36, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80', 'Mainboard AMD Socket AM5 chuẩn M-ATX hỗ trợ Ryzen 7000/8000/9000 series, 2 khe DDR5 giá rẻ.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (id, product_id, socket, ram_generation, form_factor, tdp, technical_json) VALUES
(39, 39, 'LGA1700', 'DDR4', 'M-ATX', 20, '{"Socket":"LGA1700","ChuanMain":"Micro-ATX","RAM":"DDR4","KheRAM":4}'),
(40, 40, 'LGA1700', 'DDR5', 'ATX', 30, '{"Socket":"LGA1700","ChuanMain":"ATX","RAM":"DDR5","KheRAM":4,"Wifi":"Wifi 6E"}'),
(41, 41, 'AM5', 'DDR5', 'M-ATX', 20, '{"Socket":"AM5","ChuanMain":"Micro-ATX","RAM":"DDR5","KheRAM":2}')
ON CONFLICT (id) DO NOTHING;

-- === RAM (3) ===
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(42, 3, 'Kingston Fury Beast RGB 16GB (2x8GB) DDR4 3200', 'kingston-fury-beast-rgb-16gb-d4', 'Kingston', 1290000, 1490000, 25, 36, 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80', 'Kit RAM 16GB Dual Channel LED RGB rực rỡ, độ trễ CL16 tối ưu cho dàn máy gaming tầm trung.', TRUE),
(43, 3, 'TeamGroup T-Force Delta RGB 32GB (2x16GB) DDR5 6400', 'teamgroup-tforce-delta-rgb-32gb-d5', 'TeamGroup', 3190000, 3590000, 15, 36, 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80', 'Bộ nhớ DDR5 hiệu năng cao bus 6400MHz, dải LED RGB 120 độ siêu đẹp, tương thích Intel XMP 3.0 & AMD EXPO.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (id, product_id, ram_generation, ram_bus, capacity_gb, tdp, technical_json) VALUES
(42, 42, 'DDR4', 3200, 16, 5, '{"ChuanRAM":"DDR4","DungLuong":"16GB (2x8GB)","Bus":3200,"LED":"RGB"}'),
(43, 43, 'DDR5', 6400, 32, 8, '{"ChuanRAM":"DDR5","DungLuong":"32GB (2x16GB)","Bus":6400,"LED":"RGB"}')
ON CONFLICT (id) DO NOTHING;

-- === VGA (4) ===
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(44, 4, 'MSI GeForce RTX 3060 VENTUS 2X 12G OC', 'msi-geforce-rtx-3060-ventus-2x-12g', 'MSI', 7490000, 8290000, 16, 36, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80', 'Card màn hình quốc dân 12GB VRAM thoải mái làm đồ họa và chiến game Full HD / 2K max settings.', TRUE),
(45, 4, 'ASUS ROG Strix GeForce RTX 4070 Ti SUPER 16GB', 'asus-rog-strix-rtx-4070-ti-super-16gb', 'ASUS', 26990000, 29500000, 6, 36, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80', 'Siêu phẩm card đồ họa cao cấp 16GB GDDR6X, hệ thống tản nhiệt 3 quạt Axial-tech mát lạnh, LED Aura Sync.', TRUE),
(46, 4, 'Gigabyte GeForce RTX 4090 GAMING OC 24G', 'gigabyte-rtx-4090-gaming-oc-24g', 'GIGABYTE', 52990000, 56900000, 3, 36, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80', 'Vua card đồ họa thế giới 24GB VRAM, cân mọi tác vụ AI, Render 8K và Gaming 4K đỉnh cao.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (id, product_id, tdp, vram, gpu_length_mm, technical_json) VALUES
(44, 44, 170, 12, 235, '{"Chipset":"RTX 3060","VRAM":"12GB GDDR6","TDP":"170W","ChieuDai":"235mm"}'),
(45, 45, 285, 16, 336, '{"Chipset":"RTX 4070 Ti SUPER","VRAM":"16GB GDDR6X","TDP":"285W","ChieuDai":"336mm"}'),
(46, 46, 450, 24, 340, '{"Chipset":"RTX 4090","VRAM":"24GB GDDR6X","TDP":"450W","ChieuDai":"340mm"}')
ON CONFLICT (id) DO NOTHING;

-- === SSD (5) ===
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(47, 5, 'Samsung 980 500GB PCIe NVMe M.2', 'samsung-980-500gb-pcie-nvme', 'Samsung', 1390000, 1690000, 25, 60, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80', 'Ổ cứng SSD NVMe tốc độ cao 3500MB/s, độ bền TBW cao, bảo hành chính hãng 5 năm.', TRUE),
(48, 5, 'Kingston KC3000 2TB PCIe 4.0 NVMe M.2', 'kingston-kc3000-2tb-pcie-4-nvme', 'Kingston', 4290000, 4890000, 10, 60, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80', 'Tốc độ đọc ghi xé gió 7000MB/s, dung lượng khủng 2TB tha hồ chứa game dung lượng lớn và file dựng phim.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (id, product_id, storage_interface, capacity_gb, tdp, technical_json) VALUES
(47, 47, 'M.2 NVMe PCIe 3.0', 500, 4, '{"ChuanKetNoi":"M.2 NVMe","DungLuong":"500GB","TocDoDoc":"3500MB/s"}'),
(48, 48, 'M.2 NVMe PCIe 4.0', 2048, 7, '{"ChuanKetNoi":"M.2 NVMe Gen4","DungLuong":"2048GB (2TB)","TocDoDoc":"7000MB/s"}')
ON CONFLICT (id) DO NOTHING;

-- === PSU (6) ===
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(49, 6, 'Cooler Master MWE 650 V2 650W 80 Plus Bronze', 'cooler-master-mwe-650-bronze', 'Cooler Master', 1450000, 1650000, 20, 36, 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&auto=format&fit=crop&q=80', 'Bộ nguồn công suất thực 650W chuẩn 80 Plus Bronze phổ biến nhất cho dàn máy Core i5/Ryzen 5 + RTX 4060.', TRUE),
(50, 6, 'Seasonic Focus GX-1000 1000W 80 Plus Gold ATX 3.0', 'seasonic-focus-gx-1000-gold', 'Seasonic', 4890000, 5390000, 8, 120, 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&auto=format&fit=crop&q=80', 'Nguồn máy tính siêu cao cấp 1000W Full Modular chuẩn PCIe 5.0 12VHPWR cho RTX 4080/4090, bảo hành 10 năm.', TRUE),
(51, 6, 'Antec Atom V550 550W', 'antec-atom-v550-550w', 'Antec', 790000, 950000, 30, 36, 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&auto=format&fit=crop&q=80', 'Bộ nguồn giá rẻ cho văn phòng và phòng máy học sinh sinh viên, quạt 120mm êm ái.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (id, product_id, psu_wattage, psu_efficiency, tdp, technical_json) VALUES
(49, 49, 650, '80 Plus Bronze', 0, '{"CongSuat":"650W","ChuanHieuSuat":"80 Plus Bronze","CapNguon":"Flat den"}'),
(50, 50, 1000, '80 Plus Gold', 0, '{"CongSuat":"1000W","ChuanHieuSuat":"80 Plus Gold","Modular":"Full Modular","PCIe5":true}'),
(51, 51, 550, 'Standard', 0, '{"CongSuat":"550W","ChuanHieuSuat":"Standard"}')
ON CONFLICT (id) DO NOTHING;

-- === COOLER (7) ===
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(52, 7, 'Thermalright Peerless Assassin 120 SE ARGB', 'thermalright-peerless-assassin-120-se', 'Thermalright', 890000, 1090000, 25, 24, 'https://images.unsplash.com/photo-1618764400608-9e7115eacf74?w=600&auto=format&fit=crop&q=80', 'Vua tản nhiệt khí tháp đôi 6 ống đồng hiệu năng vượt xa tầm giá, quạt kép 120mm ARGB.', TRUE),
(53, 7, 'Corsair iCUE H150i ELITE CAPELLIX XT 360mm', 'corsair-icue-h150i-elite-capellix-xt', 'Corsair', 5290000, 5890000, 7, 60, 'https://images.unsplash.com/photo-1618764400608-9e7115eacf74?w=600&auto=format&fit=crop&q=80', 'Tản nhiệt nước AIO 360mm đẳng cấp với đèn LED Capellix siêu sáng, quạt AF RGB ELITE và phần mềm iCUE.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (id, product_id, cooling_type, cooler_tdp_rating, tdp, technical_json) VALUES
(52, 52, 'Air Cooler', 245, 10, '{"LoaiTan":"Tan khi thap doi","OngDong":6,"KhaNangGiaiNhiet":"245W"}'),
(53, 53, 'AIO Liquid', 350, 15, '{"LoaiTan":"Tan nuoc AIO 360mm","Quat":3,"KhaNangGiaiNhiet":"350W"}')
ON CONFLICT (id) DO NOTHING;

-- === CASE (8) ===
INSERT INTO products (id, category_id, name, slug, brand, price, original_price, stock_quantity, warranty_months, image_url, description, is_active) VALUES
(54, 8, 'Montech Air 100 ARGB Black M-ATX', 'montech-air-100-argb-black', 'Montech', 1190000, 1390000, 18, 12, 'https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?w=600&auto=format&fit=crop&q=80', 'Vỏ case Micro-ATX mặt lưới thoáng khí, tặng sẵn 4 quạt ARGB, cửa kính cường lực mở dạng cánh cửa.', TRUE),
(55, 8, 'Corsair 4000D AIRFLOW Tempered Glass Black', 'corsair-4000d-airflow-black', 'Corsair', 2290000, 2590000, 14, 24, 'https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?w=600&auto=format&fit=crop&q=80', 'Vỏ case ATX bán chạy nhất thế giới với luồng gió tối ưu, thiết kế quản lý dây cáp RapidRoute thông minh.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_specs (id, product_id, supported_form_factors, max_gpu_length_mm, tdp, technical_json) VALUES
(54, 54, 'M-ATX,MINI-ITX', 330, 0, '{"HoTroMain":"M-ATX, ITX","ChieuDaiGPUMax":"330mm","QuatKemTheo":4}'),
(55, 55, 'ATX,M-ATX,MINI-ITX', 360, 0, '{"HoTroMain":"ATX, M-ATX, ITX","ChieuDaiGPUMax":"360mm","KinhCuongLuc":true}')
ON CONFLICT (id) DO NOTHING;

-- CẬP NHẬT SEQUENCE ĐỂ TRÁNH TRÙNG KHÓA CHÍNH KHI THÊM MỚI
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('product_specs_id_seq', (SELECT MAX(id) FROM product_specs));
