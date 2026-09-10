/** Coordinate floating corner widgets so mobile panels don't stack on top of each other. */

export type FloatingWidgetId = "news" | "earth";

export const FLOATING_WIDGET_EVENT = "ancap-floating-widget";

export type FloatingWidgetEventDetail = {
  id: FloatingWidgetId;
  open: boolean;
};

export function emitFloatingWidget(id: FloatingWidgetId, open: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<FloatingWidgetEventDetail>(FLOATING_WIDGET_EVENT, {
      detail: { id, open },
    }),
  );
}
