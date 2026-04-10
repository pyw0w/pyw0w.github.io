import type { CatalogSourceId, CatalogTitle } from '../../entities/catalog';

export interface TitleRouteParams {
  titleId: string;
  preferredSourceId: CatalogSourceId | null;
}

export function titlePath(title: Pick<CatalogTitle, 'id' | 'slug'>): string {
  return `/title/${title.slug}--${title.id}`;
}

export function parseTitleRouteParam(sourceId: string | undefined, value: string | undefined): TitleRouteParams | null {
  if (!value) return null;

  const canonicalMatch = value.match(/--([a-z0-9-]+)$/i);
  if (canonicalMatch) {
    if (!sourceId) {
      return {
        titleId: canonicalMatch[1],
        preferredSourceId: null,
      };
    }

    if (sourceId !== 'animetop' && sourceId !== 'anidub') return null;
    if (!canonicalMatch[1].startsWith(`${sourceId}-`)) return null;

    return {
      titleId: canonicalMatch[1],
      preferredSourceId: sourceId,
    };
  }

  if (sourceId) return null;

  const legacyAnimeTopMatch = value.match(/-(\d+)$/);
  if (!legacyAnimeTopMatch) return null;

  return {
    titleId: `animetop-${legacyAnimeTopMatch[1]}`,
    preferredSourceId: 'animetop',
  };
}
