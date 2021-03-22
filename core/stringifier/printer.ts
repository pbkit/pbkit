export interface Printer {
  indent(): void;
  dedent(): void;
  print(text: string): void;
  printIndent(): void;
  println(line: string): void;
  done(): string;
}

export interface CreatePrinterConfig {
  space?: string;
}
export function createPrinter(config?: CreatePrinterConfig): Printer {
  const { space = "    " } = { ...config };
  const buffer: string[] = [];
  let _indent = 0;
  return {
    indent() {
      ++_indent;
    },
    dedent() {
      --_indent;
    },
    print(text) {
      buffer.push(text);
    },
    printIndent() {
      buffer.push(space.repeat(_indent));
    },
    println(line) {
      buffer.push(space.repeat(_indent));
      buffer.push(line);
      buffer.push("\n");
    },
    done() {
      return buffer.join("");
    },
  };
}
