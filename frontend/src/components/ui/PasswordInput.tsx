"use client";

import React, { useState } from "react";

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
  id?: string;
  name?: string;
  minLength?: number;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••••••••••",
  required = true,
  disabled = false,
  className = "",
  autoComplete = "current-password",
  id,
  name,
  minLength,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        id={id}
        name={name}
        minLength={minLength}
        className={`w-full pl-3 pr-10 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs disabled:opacity-50 ${className}`}
      />

      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible(!visible)}
        title={visible ? "Ocultar contraseña" : "Ver contraseña"}
        aria-label={visible ? "Ocultar contraseña" : "Ver contraseña"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1 rounded-md cursor-pointer select-none focus:outline-none"
      >
        <img
          src={visible ? "/imgs/icons/eye-off.svg" : "/imgs/icons/eye.svg"}
          alt=""
          className="w-4 h-4"
        />
      </button>
    </div>
  );
}
