export interface CrossSellItem {
  productId: number;
  name: string;
  originalPrice: number;
  discountPercentage: number;
  bundlePrice: number;
}

export interface ProductDetail {
  productId: number;
  name: string;
  sku: string;
  basePrice: number;
  description: string | null;
  stockQuantity: number;
  crossSells: CrossSellItem[];
}