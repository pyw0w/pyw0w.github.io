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
  const match = value.match(/--([a-z0-9-]+)$/i);
  if (!match) return null;

  if (!sourceId) {
    return {
      titleId: match[1],
      preferredSourceId: null,
    };
  }

  if (sourceId !== 'animetop' && sourceId !== 'anidub') return null;
  if (!match[1].startsWith(`${sourceId}-`)) return null;

  return {
    titleId: match[1],
    preferredSourceId: sourceId,
  };
}
