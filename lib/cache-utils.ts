import fs from "fs/promises";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "data", "dependency-cache");

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

/**
 * Gets data from the file-based cache
 * @param key The cache key (usually owner_repo)
 * @param ttl Milliseconds before the cache expires (default 1 hour)
 */
export async function getCache<T>(key: string, ttl: number = 3600000): Promise<T | null> {
  try {
    const fileName = `${key.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    const filePath = path.join(CACHE_DIR, fileName);
    
    const content = await fs.readFile(filePath, "utf-8");
    const entry: CacheEntry<T> = JSON.parse(content);
    
    const now = Date.now();
    if (now - entry.timestamp > ttl) {
      return null; // Expired
    }
    
    return entry.data;
  } catch (error) {
    return null; // Cache miss or error
  }
}

/**
 * Saves data to the file-based cache
 * @param key The cache key
 * @param data The data to store
 */
export async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    
    const fileName = `${key.replace(/[^a-zA-Z0-0]/g, "_")}.json`;
    const filePath = path.join(CACHE_DIR, fileName);
    
    const entry: CacheEntry<T> = {
      timestamp: Date.now(),
      data,
    };
    
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
  } catch (error) {
    console.error(`[Cache] Failed to save cache for ${key}:`, error);
  }
}
