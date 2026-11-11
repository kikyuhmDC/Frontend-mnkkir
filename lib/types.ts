/**
 * Shared types mirroring the NestJS backend entities.
 */

export type UserRole = "admin" | "user";

/** JWT payload issued by the NestJS auth service ({ sub, username, role }). */
export interface JwtPayload {
  sub: number;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  /** Returned (with HTTP 200) when credentials are invalid. */
  error?: string;
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  created_at?: string;
}

export interface Category {
  category_id: number;
  category_code: string;
  category_name: string;
  id?: number | null;
}

export interface Product {
  product_id: number;
  product_name: string;
  description?: string | null;
  price: number;
  category_id?: number | null;
}

export interface Customer {
  customer_id: number;
  customer_name: string;
  email: string;
  phone: string;
}

export interface Address {
  address_id: number;
  customer_id: number;
  street: string;
  city: string;
  province: string;
  postal_code: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

export interface Order {
  order_id: number;
  user_id: number;
  total_amount: number;
  status: OrderStatus | string;
  created_at?: string;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

export type DeliveryStatus = "pending" | "in transit" | "delivered" | "failed";

export interface Delivery {
  delivery_id: number;
  order_id: number;
  delivery_address: string;
  delivery_date?: string | null;
  status: DeliveryStatus | string;
}

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";

export interface Payment {
  payment_id: number;
  order_id: number;
  payment_method: string;
  amount: number;
  payment_status: PaymentStatus | string;
}

/** Row shape used by the generic CRUD table (any entity + loose extras). */
export type Row = Record<string, unknown>;
