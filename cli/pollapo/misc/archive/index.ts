export function stripComponent(fileName: string, number: number): string {
  const fragments = fileName.split("/");
  const result = fragments.slice(number).join("/");
  if (!result || result === "/") return "";
  return result;
}
