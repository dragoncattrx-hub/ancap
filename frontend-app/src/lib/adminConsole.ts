/** Secret ops console base path — not linked from public navigation. */
export const ADMIN_CONSOLE_PATH =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ADMIN_CONSOLE_PATH?.replace(/^\/+|\/+$/g, "")) ||
  "ops-x7k9m2";

export function adminConsoleHref(subpath = ""): string {
  const clean = subpath.replace(/^\/+/, "");
  return clean ? `/${ADMIN_CONSOLE_PATH}/${clean}` : `/${ADMIN_CONSOLE_PATH}`;
}
