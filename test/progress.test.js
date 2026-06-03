import { describe, it, expect, beforeEach } from 'vitest';
import { useProgress } from '../src/store/progress';
beforeEach(() => {
    localStorage.clear();
    useProgress.setState({ entries: {} });
});
describe('progress store', () => {
    it('records and reads episode position', () => {
        useProgress.getState().setPosition('20', 3, 120);
        expect(useProgress.getState().getPosition('20', 3)).toBe(120);
    });
    it('persists across reads via localStorage', () => {
        useProgress.getState().setPosition('20', 1, 50);
        expect(localStorage.getItem('watch_progress')).toContain('"20"');
    });
});
