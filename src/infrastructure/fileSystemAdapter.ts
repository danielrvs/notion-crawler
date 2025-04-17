import fs from 'fs-extra';

export async function ensureDirExists(dir: string): Promise<void> {
  await fs.ensureDir(dir);
}

export async function readVisited(filePath: string): Promise<string[]> {
  return fs.readJSON(filePath) as Promise<string[]>;
}

export async function writeVisited(filePath: string, data: string[]): Promise<void> {
  await fs.writeJSON(filePath, data);
}