export type UserRole = "admin" | "photographer";
export type ProfileStatus = "pending" | "active" | "suspended";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentMethod = "credit_card" | "bank_transfer";
export type PaymentStatus = "pending" | "confirmed" | "failed";
export type OrderItemType = "album" | "extra";
export type ExtraCategory = "canvas" | "print" | "box";

export interface Company {
  id: string;
  name: string;
  tax_no: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  discount_rate: number;
  status: "active" | "suspended";
  balance: number;
  balance_block_enabled: boolean;
  tax_office: string | null;
  contact_name: string | null;
  created_at: string;
}

export interface CompanyBalanceTransaction {
  id: string;
  company_id: string;
  amount: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  company_id: string | null;
  status: ProfileStatus;
  created_at: string;
}

export interface MembershipApplication {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  tax_no: string | null;
  address: string | null;
  message: string | null;
  status: ApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_company_id: string | null;
  tax_certificate_path: string | null;
  kvkk_consent: boolean;
  kvkk_consent_at: string | null;
  user_id: string | null;
  created_at: string;
}

export interface InstagramPost {
  id: string;
  image_path: string;
  caption: string | null;
  permalink: string | null;
  sort_order: number;
  created_at: string;
}

export interface AlbumSize {
  id: string;
  code: string;
  width_cm: number | null;
  height_cm: number | null;
  sort_order: number;
}

export interface PackageType {
  id: string;
  code: string;
  name: string;
  base_page_count: number;
  extra_page_price: number;
  sort_order: number;
}

/** Sayfa sayısına/aralığına özel kampanya fiyatı (bkz. migration 0020). */
export interface PackagePagePrice {
  id: string;
  package_type_id: string;
  /** Toplam sayfa sayısı aralığı, her ikisi de dahil. max_pages null = "ve üzeri". */
  min_pages: number;
  max_pages: number | null;
  extra_page_price: number;
  created_at: string;
}

export interface AlbumSizePrice {
  id: string;
  size_id: string;
  package_type_id: string;
  price: number;
}

export interface AlbumColor {
  id: string;
  code: string;
  name: string | null;
  hex: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface AlbumModelSize {
  model_id: string;
  size_id: string;
}

export interface AlbumModelColor {
  model_id: string;
  color_id: string;
}

export interface AlbumModel {
  id: string;
  name: string;
  image_url: string | null;
  company_id: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ExtraProduct {
  id: string;
  category: ExtraCategory;
  name: string;
  price: number;
  image_url: string | null;
  company_id: string | null;
  active: boolean;
  sort_order: number;
}

export interface Order {
  id: string;
  order_no: string | null;
  company_id: string;
  created_by: string;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  subtotal: number;
  discount_rate: number;
  discount_amount: number;
  total: number;
  shipping_carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  invoice_no: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: OrderItemType;
  album_size_id: string | null;
  package_type_id: string | null;
  album_model_id: string | null;
  extra_product_id: string | null;
  quantity: number;
  page_count: number | null;
  cover_names_text: string | null;
  cover_date_text: string | null;
  album_color_id: string | null;
  album_color_label: string | null;
  unit_price: number;
  line_total: number;
  notes: string | null;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  mock_reference: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface PaymentProviderSettings {
  id: true;
  paytr_enabled: boolean;
  paytr_test_mode: boolean;
  paytr_merchant_id: string | null;
  paytr_merchant_key: string | null;
  paytr_merchant_salt: string | null;
  updated_at: string;
}

export interface PhotoChangeRequest {
  id: string;
  order_id: string;
  order_item_id: string;
  company_id: string;
  note: string;
  status: "pending" | "resolved";
  created_by: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

// Minimal Supabase Database şeması — supabase-js generic'i için yeterli.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
