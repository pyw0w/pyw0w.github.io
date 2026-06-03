import { Link } from 'react-router-dom';
import { useCatalog } from '../../api/queries';

export default function CatalogPage() {
  const { data, isLoading, error } = useCatalog();
  if (isLoading) return <p>Загрузка…</p>;
  if (error) return <p>Ошибка загрузки каталога</p>;
  return (
    <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, listStyle: 'none', padding: 0 }}>
      {data!.map((a) => (
        <li key={a.id}>
          <Link to={`/anime/${a.id}`}>
            {a.image.preview && <img src={`https://shikimori.io${a.image.preview}`} alt="" style={{ width: '100%' }} />}
            <div>{a.russian ?? a.name}</div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
