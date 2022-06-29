export function snakeToCamel(snake: string): string {
  return snake.replace(snakeToCamelRegex, snakeToCamelReplaceFn);
}

export function snakeToPascal(snake: string): string {
  return snake.replace(snakeToCamelRegex, snakeToPascalReplaceFn);
}

export function pascalToCamel(pascal: string): string {
  return pascal[0].toLowerCase() + pascal.slice(1);
}

const id = (x: any) => x;
const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1);
const snakeToCamelRegex = /^(_*)(.*?)(_*)$/;
const snakeToCamelReplaceFn = (...args: string[]) => {
  const [, $1, $2, $3] = args;
  const [head, ...rest] = $2.split("_");
  return `${$1}${head + rest.filter(id).map(capitalize).join("")}${$3}`;
};
const snakeToPascalReplaceFn = (...args: string[]) => {
  const [, $1, $2, $3] = args;
  return `${$1}${$2.split("_").filter(id).map(capitalize).join("")}${$3}`;
};
