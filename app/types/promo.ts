export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountPercent: number;
  minOrderValue: number;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  orderCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromoOrder {
  id: string;
  status: string;
  totalAmount: number;
  discountAmount: number;
  paymentMode: string;
  createdAt: string;
  customerName: string;
  email: string;
}

export interface PromoOrdersResponse {
  code: string;
  orders: PromoOrder[];
}

export interface CreatePromoInput {
  code: string;
  description?: string;
  discountPercent: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export type UpdatePromoInput = Partial<CreatePromoInput>;

export interface PromoResponse extends Partial<PromoCode> {
  error?: string;
}
