export function snakeToCamel(snake: string): string {
  const [head, ...rest] = snake.split("_");
  return (
    head + rest.map(
      (frag) => frag[0].toUpperCase() + frag.substr(1),
    ).join("")
  );
}

export function pascalToCamel(pascal: string): string {
  return pascal[0].toLowerCase() + pascal.substr(1);
}
