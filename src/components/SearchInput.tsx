import { MagnifyingGlass, CircleNotch } from '@phosphor-icons/react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchInput({ value, onChange, isLoading, placeholder = 'Поиск аниме...' }: SearchInputProps) {
  return (
    <div className="relative">
      <MagnifyingGlass
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
      />
      {isLoading && (
        <CircleNotch
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted animate-spin"
        />
      )}
    </div>
  );
}
