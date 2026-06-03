import { NavLink, Outlet } from 'react-router-dom';
import { House, MagnifyingGlass, List, User } from '@phosphor-icons/react';

const tabs = [
  { to: '/', icon: House, label: 'Каталог' },
  { to: '/search', icon: MagnifyingGlass, label: 'Поиск' },
  { to: '/lists', icon: List, label: 'Списки' },
  { to: '/login', icon: User, label: 'Профиль' },
] as const;

export default function App() {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <main className="flex-1 pb-[72px]">
        <div className="max-w-[1280px] mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-border backdrop-blur-xl">
        <div className="max-w-[1280px] mx-auto flex items-center justify-around h-14">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
                  isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              <Icon size={22} weight="fill" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
