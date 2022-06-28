export function snakeToCamel(snake: string): string {
  return snake.replace(snakeToCamelRegex, snakeToCamelReplaceFn);
}

export function pascalToCamel(pascal: string): string {
  return pascal[0].toLowerCase() + pascal.substr(1);
}

const id = (x: any) => x;
export const capitalize = (word: string) =>
  word[0].toUpperCase() + word.substr(1);
const snakeToCamelRegex = /^(_*)(.*?)(_*)$/;
const snakeToCamelReplaceFn = (...args: string[]) => {
  const [, $1, $2, $3] = args;
  const [head, ...rest] = $2.split("_");
  return `${$1}${head + rest.filter(id).map(capitalize).join("")}${$3}`;
};
