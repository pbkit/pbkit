export function range(start: number, end?: number) {
  return {
    includes(value: number) {
      return start <= value && (end ? (value <= end) : true);
    },
  };
}
