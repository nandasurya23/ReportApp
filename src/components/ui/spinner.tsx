interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-10 w-10" : "h-6 w-6";
  const borderClass = size === "lg" ? "border-[3px]" : "border-2";

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={`relative inline-flex shrink-0 items-center justify-center align-middle ${sizeClass} ${className}`}
    >
      <span
        className={`absolute inset-0 rounded-full border border-slate-200/80`}
        aria-hidden="true"
      />
      <span
        className={`absolute inset-0 animate-spin rounded-full ${borderClass} border-slate-300 border-t-cyan-500 border-r-cyan-400 motion-reduce:animate-none`}
        aria-hidden="true"
      />
      <span className="sr-only">Loading</span>
    </span>
  );
}
