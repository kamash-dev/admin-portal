export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  // Legacy statuses kept for backward compatibility with older orders
  | "PAID"
  | "SHIPPED";

export interface OrderItemVariant {
  id: string;
  title: string;
  size: string;
  color: string;
  price: number;
  images: string[];
  product: {
    id: string;
    name: string;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  productVariantId: string;
  variant: OrderItemVariant;
  quantity: number;
  price: number;
}

export interface OrderUser {
  email: string;
  firstName: string;
  lastName: string;
}

export type PaymentMode = "COD" | "ONLINE";

export interface Order {
  id: string;
  userId: string | null;
  user: OrderUser | null;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  paymentMode: PaymentMode;
  status: OrderStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: Pagination;
}

export interface OrderDetailAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface OrderDetailCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface OrderDetailItem {
  id: string;
  quantity: number;
  price: number;
  lineTotal: number;
  variant: {
    id: string;
    title: string;
    size: string;
    color: string;
    images: string[];
  };
  product: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface OrderDetail {
  id: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMode: PaymentMode;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  customer: OrderDetailCustomer | null;
  deliveryAddress: OrderDetailAddress | null;
  items: OrderDetailItem[];
}
