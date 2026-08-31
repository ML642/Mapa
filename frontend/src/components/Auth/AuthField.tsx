import type { ReactNode } from "react";

interface AuthFieldProps {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    icon: ReactNode;
    labelAction?: ReactNode;
    inputClassName?: string;
}

const BASE_INPUT_CLASS_NAME =
    "app-input w-full h-full rounded-[12px] pl-[44px] pr-[16px] py-[12px] text-[14px] font-[400] tracking-[-0.48px] placeholder:text-[12px] focus:outline-none";

export default function AuthField({
    id,
    label,
    type,
    value,
    onChange,
    placeholder,
    error,
    disabled = false,
    icon,
    labelAction,
    inputClassName = "",
}: AuthFieldProps) {
    const borderClassName = error ? "app-input-error" : "";

    return (
        <div className="flex flex-col gap-[8px] items-start">
            {labelAction ? (
                <div className="flex w-full items-start justify-between gap-2">
                    <label
                        htmlFor={id}
                        className="text-[16px] font-[400] tracking-[-0.48px] text-brand"
                    >
                        {label}
                    </label>
                    {labelAction}
                </div>
            ) : (
                <label
                    htmlFor={id}
                    className="text-brand text-[16px] font-[400] tracking-[-0.48px]"
                >
                    {label}
                </label>
            )}

            <div className="relative w-full max-w-full h-[44px]">
                {icon}
                <input
                    id={id}
                    type={type}
                    value={value}
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className={`${BASE_INPUT_CLASS_NAME} ${borderClassName} ${inputClassName}`.trim()}
                />
            </div>

            {error ? <span className="text-feedback-error text-[10px]">{error}</span> : null}
        </div>
    );
}
