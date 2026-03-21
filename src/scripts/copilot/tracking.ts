// src/scripts/copilot/tracking.ts

interface TrackingEvent {
  type: string;
  journeyId: string;
  metadata: Record<string, any>;
  timestamp: string;
}

const EVENTS_KEY = 'may-copilot-events';

export function trackEvent(
  type: string,
  journeyId: string,
  metadata: Record<string, any> = {}
): void {
  const event: TrackingEvent = {
    type,
    journeyId,
    metadata,
    timestamp: new Date().toISOString(),
  };

  // Console for dev visibility
  console.log(`[copilot] ${type}`, metadata);

  // Persist to localStorage
  try {
    const events: TrackingEvent[] = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    events.push(event);
    // Keep last 500 events
    if (events.length > 500) events.splice(0, events.length - 500);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch { /* silent */ }
}

export function getEvents(journeyId?: string): TrackingEvent[] {
  try {
    const events: TrackingEvent[] = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    if (journeyId) return events.filter(e => e.journeyId === journeyId);
    return events;
  } catch {
    return [];
  }
}
