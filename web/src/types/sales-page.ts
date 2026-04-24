export type Currency = "GNF" | (string & {});

export type Feature = {
  title: string;
  text: string;
  /** Image optionnelle (URL publique, ex. Supabase Storage). */
  image_url?: string | null;
};
export type UseCase = { title: string; text: string; color?: string };
export type HowItWorksStep = { title?: string; text: string; highlightColor?: string };
export type Testimonial = { name: string; rating: number; text: string; date?: string };
export type FaqItem = { question: string; answer: string; color?: string };

export type ProductType = "electronic" | "physical" | (string & {});

export type Product = {
  id: string;
  updated_at?: string | null;
  slug: string;
  title: string;
  category?: string | null;
  product_type?: ProductType | null;
  description_html?: string | null;
  price_original: number;
  price_promo: number;
  currency: Currency;
  timer_duration_minutes: number;
  stock_total: number;
  sales_count_initial: number;
  main_image_url?: string | null;
  gallery_urls?: string[] | null;
  product_file_path?: string | null;
  payment_link_url?: string | null;
  features: Feature[];
  use_cases: UseCase[];
  how_it_works?: HowItWorksStep[];
  testimonials: Testimonial[];
  faqs: FaqItem[];
  is_published: boolean;
};

