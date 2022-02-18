export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T
export type Awaitable<T> = Promise<T> | T
export type Arrayable<T> = T | Array<T>
