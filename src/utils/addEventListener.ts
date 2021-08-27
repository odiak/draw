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

/** addEventListenerのwrapper
 *
 * 登録と同時に登録解除用コールバックを返してくれる
 *
 * @param target event listenerを登録したい対象。addEventListnerとremoveEventListenerが定義されてあれば何でも良い
 * @param eventType event name
 * @param handler 登録するevent listener
 * @param option addEventListenerに渡すoptionと同じ
 * @return 登録解除用コールバック
 */
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
