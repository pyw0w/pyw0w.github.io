interface ErrorMessageProps {
  message?: string;
  retry?: () => void;
}

export function ErrorMessage({ message = 'Что-то пошло не так', retry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-10 h-10 rounded-full bg-error-muted flex items-center justify-center mb-3">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-error">
          <path d="M10 6v4m0 4h.01M18 10a8 8 0 11-16 0 8 8 0 0116 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm text-text-secondary mb-3">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="text-sm text-accent hover:text-accent-hover transition-colors active:scale-[0.97]"
        >
          Попробовать снова
        </button>
      )}
    </div>
  );
}
