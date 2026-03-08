interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  const sizeClass =
    size === "sm" ? "h-4 w-4 border-2" : size === "lg" ? "h-10 w-10 border-4" : "h-6 w-6 border-2";

  return (
    <span
      className={`inline-block animate-spin rounded-full border-slate-300 border-t-cyan-500 ${sizeClass} ${className}`}
      aria-hidden="true"
    />
  );
}
