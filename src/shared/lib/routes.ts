import type { CatalogTitle } from '../../entities/catalog';

export function titlePath(title: Pick<CatalogTitle, 'id' | 'slug'>): string {
  return `/title/${title.slug}-${title.id}`;
}

export function parseTitleRouteParam(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/-(\d+)$/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}
