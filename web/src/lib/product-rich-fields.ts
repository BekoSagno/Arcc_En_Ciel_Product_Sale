import { sanitizePlainOneLine, sanitizeRichHtml } from "@/lib/sanitize-rich-html";

type FeatureIn = {
  title: string;
  text: string;
  image_url?: string | null;
};

type UseCaseIn = { title: string; text: string };
type FaqIn = { question: string; answer: string; color?: string | null };
type TestimonialIn = {
  name: string;
  rating: number;
  text: string;
  date?: string | null;
};

type HowItWorkIn = { text: string };

export function sanitizeProductRichFields(input: {
  features: FeatureIn[];
  use_cases: UseCaseIn[];
  how_it_works?: HowItWorkIn[];
  faqs?: FaqIn[];
  testimonials?: TestimonialIn[];
}): {
  features: FeatureIn[];
  use_cases: UseCaseIn[];
  how_it_works?: HowItWorkIn[];
  faqs?: FaqIn[];
  testimonials?: TestimonialIn[];
} {
  return {
    features: input.features.map((f) => ({
      ...f,
      title: sanitizePlainOneLine(f.title),
      text: sanitizeRichHtml(f.text),
    })),
    use_cases: input.use_cases.map((u) => ({
      ...u,
      title: sanitizePlainOneLine(u.title),
      text: sanitizeRichHtml(u.text),
    })),
    ...(input.how_it_works
      ? {
          how_it_works: input.how_it_works.map((s) => ({
            text: sanitizeRichHtml(s.text),
          })),
        }
      : {}),
    ...(input.faqs
      ? {
          faqs: input.faqs.map((f) => ({
            ...f,
            question: sanitizePlainOneLine(f.question),
            answer: sanitizeRichHtml(f.answer),
          })),
        }
      : {}),
    ...(input.testimonials
      ? {
          testimonials: input.testimonials.map((t) => ({
            ...t,
            name: sanitizePlainOneLine(t.name),
            text: sanitizeRichHtml(t.text),
          })),
        }
      : {}),
  };
}
