// Helper function to generate a ksortable prefixed ID
export function createId(prefix: string, override?: string): string {
  if (override) return `${prefix}_${override}`;
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}${randomSuffix}`;
}

export function createUserId(id?: string) {
  return createId("usr", id);
}

export function createDocId(id?: string) {
  return createId("doc", id);
}

export function createThreadId(id?: string) {
  return createId("thr", id);
}

export function createMessageId(id?: string) {
  return createId("msg", id);
}
