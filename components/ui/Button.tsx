"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonClasses, ButtonSize, ButtonVariant } from "@/lib/buttonStyles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, `cursor-pointer ${className}`)} {...rest}>
      {children}
    </button>
  );
}
