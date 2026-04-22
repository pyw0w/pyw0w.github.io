export type TelemetryEventName =
  | 'title_open'
  | 'playback_start'
  | 'search_submit'
  | 'filter_change'
  | 'favorite_toggle';

export interface TelemetryEvent {
  name: TelemetryEventName;
  timestamp: string;
  payload: Record<string, unknown>;
}

export function trackEvent(name: TelemetryEventName, payload: Record<string, unknown> = {}): void {
  const event: TelemetryEvent = {
    name,
    payload,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('av-player:telemetry', { detail: event }));
  }

  if (import.meta.env.DEV) {
    console.debug('[telemetry]', event);
  }
}
