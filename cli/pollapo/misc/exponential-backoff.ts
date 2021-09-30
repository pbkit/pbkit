import wait from "../../../core/misc/async/wait.ts";

export default async function backoff<T>(
  op: () => Promise<T>,
  stop: (err: any, i: number) => boolean = (_, i) => i >= 2,
): Promise<T> {
  for (let i = 0;; ++i) {
    try {
      return await op();
    } catch (err) {
      if (stop(err, i)) throw err;
      const t = Math.pow(2, i) * 500;
      await wait(t + t * Math.random());
    }
  }
}
