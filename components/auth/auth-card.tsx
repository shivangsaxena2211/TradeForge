import { cn } from "cn";

type AuthCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "definn-card w-full max-w-[400px] border-border/60 p-5 shadow-lg md:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
