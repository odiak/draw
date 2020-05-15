type Listenable<EventType extends string, Event> = {
  addEventListener(
    eventType: EventType,
    handler: (event: Event) => void,
    option?: AddEventListenerOptions
  ): void
  removeEventListener(
    eventType: EventType,
    handler: (event: Event) => void,
    option?: EventListenerOptions
  ): void
}

export function addEventListener<ET extends string, E>(
  target: Listenable<ET, E>,
  eventType: ET,
  handler: (e: E) => void,
  option?: AddEventListenerOptions
): () => void {
  target.addEventListener(eventType, handler, option)
  return () => {
    target.removeEventListener(eventType, handler, option)
  }
}
