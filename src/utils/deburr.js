const accentControlRegex = /[\u0300-\u036F]/g;

/**
 * Deburrs a string by converting
 * [Latin-1 Supplement](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
 * and [Latin Extended-A](https://en.wikipedia.org/wiki/Latin_Extended-A)
 * letters to basic Latin letters and removing
 * [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
 *
 * @example
 * deburr('déjà vu')
 * // => 'deja vu'
 * @param str The string to deburr.
 * @returns Returns the deburred string.
 *
 * @author Maximilian Dewald
 * @license MIT
 * @see {@link https://github.com/Maggi64/moderndash/blob/492d1d043a7368aa895df6a8224861838b1b7fd3/package/src/string/deburr.ts}
 */
export function deburr(str) {
  return str.normalize("NFD").replace(accentControlRegex, "");
}
