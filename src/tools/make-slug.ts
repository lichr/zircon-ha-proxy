export function makeSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').trim();
}
