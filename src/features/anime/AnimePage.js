import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAnime } from '../../api/queries';
import { useKodikMatch } from './useKodikMatch';
import { workerApi } from '../../api/worker';
import { Player } from '../player/Player';
import { useProgress } from '../../store/progress';
export default function AnimePage() {
    const { id = '' } = useParams();
    const anime = useAnime(id);
    const match = useKodikMatch(id);
    const [translation, setTranslation] = useState('0');
    const [episode, setEpisode] = useState(1);
    const { getPosition, setPosition } = useProgress();
    const effectiveTranslation = translation !== '0'
        ? translation
        : match.data?.translations[0]?.id ?? '0';
    const stream = useQuery({
        queryKey: ['stream', id, episode, effectiveTranslation],
        enabled: Boolean(match.data),
        queryFn: () => workerApi.stream({ id, episode, translation: effectiveTranslation }),
    });
    if (anime.isLoading)
        return _jsx("p", { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026" });
    if (!anime.data)
        return _jsx("p", { children: "\u0422\u0430\u0439\u0442\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
    const a = anime.data;
    const episodesCount = match.data?.episodes ?? a.episodes ?? 1;
    return (_jsxs("article", { children: [_jsx("h1", { children: a.russian ?? a.name }), match.data && (_jsxs("div", { children: [_jsxs("label", { children: ["\u041E\u0437\u0432\u0443\u0447\u043A\u0430:", ' ', _jsx("select", { value: effectiveTranslation, onChange: (e) => setTranslation(e.target.value), children: match.data.translations.map((t) => (_jsxs("option", { value: t.id, children: [t.title, " (", t.type, ")"] }, t.id))) })] }), _jsxs("label", { children: [" \u0421\u0435\u0440\u0438\u044F:", ' ', _jsx("select", { value: episode, onChange: (e) => setEpisode(Number(e.target.value)), children: Array.from({ length: episodesCount }, (_, i) => i + 1).map((n) => (_jsx("option", { value: n, children: n }, n))) })] })] })), stream.isError && _jsx("p", { children: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043F\u043E\u0442\u043E\u043A. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u0443\u044E \u043E\u0437\u0432\u0443\u0447\u043A\u0443." }), stream.data && (_jsx(Player, { manifest: stream.data.manifest, startAt: getPosition(id, episode), onTime: (s) => setPosition(id, episode, s) })), _jsx("p", { children: a.description })] }));
}
