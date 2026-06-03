import { Link, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div>
      <nav>
        <Link to="/">Каталог</Link> · <Link to="/search">Поиск</Link> ·{' '}
        <Link to="/lists">Списки</Link> · <Link to="/login">Вход</Link>
      </nav>
      <main><Outlet /></main>
    </div>
  );
}
