import { SignIn } from '@phosphor-icons/react';
import { buildAuthorizeUrl } from '../../auth/oauth';
import { useAuth } from '../../auth/AuthContext';

export default function LoginPage() {
  const { isAuthenticated, logout } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="flex flex-col items-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-accent-muted flex items-center justify-center">
          <SignIn size={28} className="text-accent" />
        </div>
        <p className="text-sm text-text-secondary">Вы авторизованы</p>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm text-error border border-error/20 rounded-pill hover:bg-error-muted transition-colors active:scale-[0.97]"
        >
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-16 space-y-4">
      <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center">
        <SignIn size={28} className="text-text-muted" />
      </div>
      <h1 className="text-lg font-semibold">Вход</h1>
      <p className="text-sm text-text-secondary text-center max-w-[28ch]">
        Авторизуйтесь через Shikimori для доступа к спискам и отметкам просмотра
      </p>
      <a
        href={buildAuthorizeUrl()}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-base rounded-pill text-sm font-medium hover:bg-accent-hover transition-colors active:scale-[0.97]"
      >
        <SignIn size={18} />
        Войти через Shikimori
      </a>
    </div>
  );
}
