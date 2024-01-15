import * as nanoid from 'nanoid'

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const uid = nanoid.customAlphabet(alphabet, 12);
const longUid = nanoid.customAlphabet(alphabet, 20);

/**
 * Generate an UID with specified length (default to 12).
 * https://zelark.github.io/nano-id-cc/
 * @param size the length of generated id
 */
export function makeUid(long: boolean = false): string {
  if (long) {
    return longUid();
  } else {
    return uid();
  }
}
