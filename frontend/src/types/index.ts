// ==============================================================================
// CONTRACT TYPES: ỨNG DỤNG IOTS VÀ AI VÀO HỆ THỐNG WEB BÁN LINH KIỆN MÁY TÍNH
// ==============================================================================

export type Role = 'ROLE_CUSTOMER' | 'ROLE_ADMIN' | 'ROLE_WAREHOUSE' | 'ROLE_TECHNICIAN';

export interface UserDto {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  isActive?: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  displayOrder: number;
  productCount?: number;
}

export interface ProductSpecDto {
  socket?: string;
  ramGeneration?: string;
  ramBus?: number;
  formFactor?: string;
  tdp: number;
  psuWattage?: number;
  psuEfficiency?: string;
  vram?: number;
  storageInterface?: string;
  coolingType?: string;
  dimensions?: string;
  coolerTdpRating?: number;
  gpuLengthMm?: number;
  maxGpuLengthMm?: number;
  supportedFormFactors?: string;
  cores?: number;
  threads?: number;
  baseClock?: string;
  boostClock?: string;
  capacityGb?: number;
  technicalJson?: Record<string, any>;
}

export interface ProductDto {
  id: number;
  categoryId: number;
  categoryName?: string;
  categorySlug?: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  warrantyMonths: number;
  imageUrl: string;
  images?: string[];
  description?: string;
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
  specs?: ProductSpecDto | null;
}

export interface ReviewDto {
  id: number;
  productId: number;
  userFullName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  product: ProductDto;
  quantity: number;
}

export interface CartValidationResult {
  productId: number;
  name: string;
  requested: number;
  stockQuantity: number;
  available: boolean;
  price: number;
}

export interface CouponResult {
  code: string;
  description: string;
  discountAmount: number;
  freeShipping: boolean;
}

export type PaymentMethod = 'COD' | 'BANK_TRANSFER_QR';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type OrderStatus = 'CHO_XAC_NHAN' | 'DA_XAC_NHAN' | 'DANG_GIAO' | 'DA_GIAO' | 'DA_HUY';

export interface OrderItemDto {
  id: number;
  productId: number;
  productName: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  warrantyMonths?: number;
}

export interface VietQrPaymentInfo {
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
  qrPayload: string;
  qrImageUrl: string;
}

export interface OrderDto {
  id: number;
  orderCode: string;
  userId?: number;
  customerName: string;
  phone: string;
  shippingAddress: string;
  city: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  couponCode?: string;
  shippingFee: number;
  finalAmount: number;
  note?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
  payment?: VietQrPaymentInfo | null;
}

export interface CreateOrderRequest {
  customerName: string;
  phone: string;
  shippingAddress: string;
  city: string;
  note?: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  items: { productId: number; quantity: number }[];
}

export type PcSlot = 'CPU' | 'MAINBOARD' | 'RAM' | 'VGA' | 'SSD' | 'PSU' | 'COOLER' | 'CASE';

export interface BuildSelection {
  cpuId?: number;
  mainboardId?: number;
  ramId?: number;
  gpuId?: number;
  storageId?: number;
  psuId?: number;
  coolerId?: number;
  caseId?: number;
}

export interface CompatibilityIssue {
  rule: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface CompatibilityReport {
  compatible: boolean;
  totalPrice: number;
  totalTdp: number;
  recommendedPsu: number;
  issues: CompatibilityIssue[];
  passed: { rule: string; message: string }[];
}

export interface PcBuildDto {
  id: number;
  buildName: string;
  totalPrice: number;
  totalTdp: number;
  recommendedPsu: number;
  isCompatible: boolean;
  compatibilityReport?: string;
  createdAt: string;
  cpu?: ProductDto | null;
  mainboard?: ProductDto | null;
  ram?: ProductDto | null;
  gpu?: ProductDto | null;
  storage?: ProductDto | null;
  psu?: ProductDto | null;
  cooler?: ProductDto | null;
  caseProduct?: ProductDto | null;
}

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'WARNING';
export type Scenario = 'IDLE' | 'GAMING' | 'STRESS' | 'STOP';

export interface DeviceDto {
  id: number;
  userId?: number;
  ownerName?: string;
  deviceCode: string;
  deviceName: string;
  macAddress?: string;
  status: DeviceStatus;
  esp32Ip?: string;
  roomLocation?: string;
  lastPing?: string;
  currentScenario?: Scenario;
  currentCpu?: ProductDto | null;
  currentMainboard?: ProductDto | null;
  currentRam?: ProductDto | null;
  currentGpu?: ProductDto | null;
  currentPsu?: ProductDto | null;
  currentCooler?: ProductDto | null;
}

export interface TelemetryDto {
  deviceCode: string;
  cpuLoad: number;
  cpuTemp: number;
  cpuClockMhz: number;
  ramUsage: number;
  ramUsedGb: number;
  ramTotalGb: number;
  gpuLoad: number;
  gpuTemp: number;
  fanSpeedRpm: number;
  powerDrawW: number;
  ambientTemp: number;
  ambientHumidity: number;
  dustDensity?: number;
  statusFlag: string;
  recordedAt: string;
}

export interface AlertDto {
  id: number;
  deviceCode: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  value: number;
  createdAt: string;
}

export interface AiRecommendationDto {
  id: number;
  bottleneckType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  diagnosticText: string;
  currentComponent?: ProductDto | null;
  recommendedProduct: ProductDto;
  expectedPerformanceGain: string;
  isViewed: boolean;
  isApplied: boolean;
  createdAt: string;
}

export interface DiagnosticReport {
  deviceCode: string;
  deviceName: string;
  healthScore: number;
  analyzedSamples: number;
  periodDays: number;
  generatedAt: string;
  metrics: {
    avgCpuLoad: number;
    p95CpuLoad: number;
    avgGpuLoad: number;
    avgRamUsage: number;
    ramOver88Ratio: number;
    maxCpuTemp: number;
    maxGpuTemp: number;
    avgCpuTemp: number;
    overheatRatio: number;
    peakPowerW: number;
    psuWattage: number;
    psuLoadRatio: number;
    maxFanRpm: number;
  };
  findings: {
    bottleneckType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    diagnosticText: string;
  }[];
  recommendations: AiRecommendationDto[];
}

export interface AdminDashboardDto {
  totalRevenue: number;
  monthRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockCount: number;
  productsCount: number;
  customersCount: number;
  onlineDevices: number;
  totalDevices: number;
  revenueByDay: { label: string; revenue: number; orders: number }[];
  revenueByMonth: { label: string; revenue: number; orders: number }[];
  categoryShare: { name: string; value: number }[];
  topProducts: { productId: number; name: string; quantity: number; revenue: number }[];
  recentAlerts: AlertDto[];
  lowStockProducts: ProductDto[];
}
