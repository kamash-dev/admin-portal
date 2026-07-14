export interface ProductVariant {
  id: string;
  productId: string;
  title: string;
  size: string | null;
  color: string | null;
  price: number;
  images: string[];
  tags: string[];
  inventory: number;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  category: Category | null;
  variants: ProductVariant[];
  createdAt: string;
}

export interface CreateVariantInput {
  title: string;
  size?: string | null;
  color?: string | null;
  price: number;
  images: string[];
  tags: string[];
  inventory: number;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  categoryId?: string;
  variants: CreateVariantInput[];
}

export interface CreateProductResponse {
  success?: boolean;
  message?: string;
  product?: Product;
  error?: string;
}
