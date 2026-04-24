"use client";

type Props = {
  text: string;
  variant: "yellow" | "red" | "pink" | "orange";
  className?: string;
};

export function BrushText({ text, variant, className }: Props) {
  return (
    <span
      className={[
        "relative inline-block align-middle",
        variant === "red" ? "px-3 py-1" : "px-1 py-0.5",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={["relative z-10", className].filter(Boolean).join(" ")}>
        {text}
      </span>
      {variant === "yellow" ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 rounded-[10px] bg-[#FFD84D] opacity-95 [transform:rotate(-1deg)] shadow-[0_10px_18px_rgba(0,0,0,0.06)]"
          style={{
            clipPath:
              "polygon(2% 18%, 10% 6%, 28% 2%, 52% 4%, 76% 10%, 97% 22%, 98% 84%, 90% 96%, 70% 98%, 46% 96%, 20% 92%, 4% 82%)",
          }}
        />
      ) : variant === "pink" ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 rounded-[12px] bg-[#FF6B86] opacity-95 [transform:rotate(-1deg)] shadow-[0_10px_18px_rgba(0,0,0,0.08)]"
          style={{
            clipPath:
              "polygon(2% 30%, 10% 10%, 28% 2%, 52% 6%, 76% 14%, 97% 32%, 98% 78%, 88% 94%, 66% 98%, 44% 94%, 18% 90%, 4% 80%)",
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(0,0,0,0.10)), repeating-linear-gradient(135deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 3px, rgba(0,0,0,0.06) 4px, rgba(0,0,0,0.06) 8px)",
          }}
        />
      ) : variant === "orange" ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 rounded-[12px] bg-[#FF8A3D] opacity-95 [transform:rotate(-1deg)] shadow-[0_10px_18px_rgba(0,0,0,0.08)]"
          style={{
            clipPath:
              "polygon(2% 35%, 12% 12%, 30% 2%, 52% 6%, 76% 16%, 97% 38%, 98% 76%, 88% 94%, 66% 98%, 44% 94%, 18% 90%, 4% 80%)",
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.10)), repeating-linear-gradient(135deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 3px, rgba(0,0,0,0.06) 4px, rgba(0,0,0,0.06) 8px)",
          }}
        />
      ) : (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 rounded-[14px] bg-[#C81C10] [transform:rotate(-1deg)] shadow-[0_10px_18px_rgba(0,0,0,0.10)]"
          style={{
            clipPath:
              "polygon(3% 28%, 14% 6%, 34% 2%, 58% 6%, 83% 12%, 98% 34%, 97% 72%, 84% 92%, 56% 98%, 30% 94%, 8% 86%, 2% 62%)",
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.10)), repeating-linear-gradient(135deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 2px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 6px)",
          }}
        />
      )}
    </span>
  );
}

