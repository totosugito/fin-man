import {randomUUID} from "node:crypto";

export const cleanTextFormat = (original: string) => {
   // Ensure extension is preserved
  return original
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '_')  // Replace special chars with underscore
    .replace(/^_+|_+$/g, '')       // Remove leading/trailing underscores
    .replace(/\.+/g, '.')          // Replace multiple dots with single dot
    .replace(/(\.\w+)?$/, (_: string, ext: string | undefined) => ext || '')
}

export const createUniqueFileName = (original: string, defaultName: string, newExt?: string) => {
  const cleanName = cleanTextFormat(original);

  // Generate a unique filename with cleaned name
  const fileExt = cleanName.split('.').pop();
  const baseName = cleanName.replace(/\.[^/.]+$/, '') || defaultName;
  if(newExt) {
    return `${baseName}_${randomUUID().substring(0, 8)}.${newExt}`
  }
  return `${baseName}_${randomUUID().substring(0, 8)}.${fileExt}`
}
