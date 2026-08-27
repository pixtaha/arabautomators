import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";
import { buttonClasses, ButtonSize, ButtonVariant } from "@/lib/buttonStyles";

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
