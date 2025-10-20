export function sanitizeTagName(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isValidTagName(tag: string): boolean {
  return /^[a-z0-9-]+$/.test(tag) && tag.length > 0;
}