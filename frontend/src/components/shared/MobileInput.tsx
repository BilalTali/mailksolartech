import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface MobileInputProps {
    label: string;
    required?: boolean;
    value: string;
    onChange: (val: string) => void;
    error?: string;
    placeholder?: string;
    name?: string;
    id?: string;
    disabled?: boolean;
    className?: string;
}

/**
 * MobileInput — 10-digit Indian mobile input with +91 prefix.
 * - Strips non-digit characters on every keystroke
 * - Caps input at 10 digits
 * - Shows digit counter or green checkmark
 * - IMPORTANT: only the 10-digit number is submitted — NOT the +91 prefix
 */
export const MobileInput: React.FC<MobileInputProps> = ({
    label,
    required = false,
    value,
    onChange,
    error,
    placeholder = '98765 43210',
    name,
    id,
    disabled = false,
    className = '',
}) => {
    const fieldId = id ?? `mobile-${name ?? label.toLowerCase().replace(/\s+/g, '-')}`;
    const isValid = value.length === 10;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '');
        if (digits.length <= 10) onChange(digits);
    };

    return (
        <div className={className}>
            <label htmlFor={fieldId} className="label">
                {label} {required && <span className="text-danger"> *</span>}
            </label>

            <div
                className={`flex rounded-xl border overflow-hidden transition-all
                    ${disabled ? 'opacity-60 cursor-not-allowed bg-neutral-50' :
                        error
                            ? 'border-danger ring-1 ring-danger/30'
                            : isValid
                                ? 'border-success'
                                : 'border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20'
                    }`}
            >
                {/* Country code prefix — display only, NOT submitted */}
                <div className="flex items-center gap-1.5 px-3 bg-neutral-50 border-r border-gray-200 flex-shrink-0 select-none">
                    <span className="text-sm" aria-hidden="true">🇮🇳</span>
                    <span className="text-sm font-semibold text-neutral-600">+91</span>
                </div>

                {/* 10-digit input */}
                <input
                    id={fieldId}
                    name={name}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    aria-required={required}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${fieldId}-error` : undefined}
                    className="flex-1 px-3 py-2.5 text-sm outline-none bg-white
                               placeholder:text-neutral-300 disabled:cursor-not-allowed"
                />

                {/* Validation indicator */}
                {value.length > 0 && (
                    <div className="flex items-center pr-3 flex-shrink-0">
                        {isValid
                            ? <CheckCircle2 className="w-4 h-4 text-success" />
                            : <span className="text-xs text-neutral-400 font-mono">{value.length}/10</span>
                        }
                    </div>
                )}
            </div>

            {error
                ? <p id={`${fieldId}-error`} className="text-danger text-xs mt-1">{error}</p>
                : value.length > 0 && !isValid
                    ? <p className="text-amber-500 text-xs mt-1">Enter all 10 digits</p>
                    : null
            }
        </div>
    );
};

export default MobileInput;
