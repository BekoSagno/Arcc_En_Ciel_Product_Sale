export type DashboardProductRow = {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
  product_type?: string | null;
  price_promo: number;
  currency: string;
  is_published: boolean;
};
