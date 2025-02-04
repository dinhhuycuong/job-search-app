export class CacheService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly TTL = 1000 * 60 * 15 // 15 minutes

  private createKey(namespace: string, params: any): string {
    return `${namespace}:${JSON.stringify(params)}`
  }

  set(namespace: string, params: any, data: any): void {
    const key = this.createKey(namespace, params)
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get<T>(namespace: string, params: any): T | null {
    const key = this.createKey(namespace, params)
    const cached = this.cache.get(key)

    if (!cached) return null

    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  clear(): void {
    this.cache.clear()
  }
}

export const cacheService = new CacheService()
