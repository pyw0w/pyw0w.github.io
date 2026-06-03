import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearch } from '../../api/queries';

export default function SearchPage() {
  const [term, setTerm] = useState('');
  const { data, isFetching } = useSearch(term);
  return (
    <div>
      <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Поиск аниме…" />
      {isFetching && <span> …</span>}
      <ul>
        {(data ?? []).map((a) => (
          <li key={a.id}><Link to={`/anime/${a.id}`}>{a.russian ?? a.name}</Link></li>
        ))}
      </ul>
    </div>
  );
}
