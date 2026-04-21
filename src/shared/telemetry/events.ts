export type AnalyticsEventName =
  | 'title_open'
  | 'playback_start'
  | 'search_submit'
  | 'filter_change'
  | 'favorite_toggle';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  timestamp: string;
  payload: Record<string, unknown>;
}

export function trackEvent(name: AnalyticsEventName, payload: Record<string, unknown> = {}): void {
  const event: AnalyticsEvent = {
    name,
    payload,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('av-player:analytics', { detail: event }));
  }

  if (import.meta.env.DEV) {
    console.debug('[analytics]', event);
  }
}
