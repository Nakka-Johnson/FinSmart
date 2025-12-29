/**
 * Utility for conditionally joining classNames
 * Lightweight alternative to classnames/clsx package
 */
export function clsx(
  ...args: (string | boolean | null | undefined | Record<string, boolean>)[]
): string {
  const classes: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === 'string') {
      classes.push(arg);
    } else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}
