import DOMPurify from 'dompurify';

export function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeHtml(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['br', 'p', 'b', 'strong', 'i', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

export function formatScore(score: number): string {
  return score ? score.toFixed(1) : '—';
}

export function formatGenres(genres: string[]): string {
  return genres.join(', ');
}
