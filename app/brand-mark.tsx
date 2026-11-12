type BrandMarkProps = {
  className?: string;
};

export default function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 40V13L15 24L24 7L33 24L41 13V40"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      <path d="M7 40H41" className="brand-mark-base" strokeWidth="4.5" />
      <circle cx="7" cy="13" r="2.2" className="brand-mark-accent" />
      <circle cx="24" cy="7" r="2.2" className="brand-mark-accent" />
      <circle cx="41" cy="13" r="2.2" className="brand-mark-accent" />
    </svg>
  );
}
