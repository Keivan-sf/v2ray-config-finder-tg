const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export async function keepTryingAsync<T>(
  job: () => Promise<T>,
  options?: { delay?: number },
): Promise<T> {
  const delay = options?.delay ?? 2000;
  while (true) {
    try {
      return await job();
    } catch (err) {
      await sleep(delay);
    }
  }
}
