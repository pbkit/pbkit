const indirectEval = globalThis.eval;
type EvalContext = (source: string, specifier?: string) => [any, null | Error];
const evalContext: EvalContext = (
  (globalThis as any).Deno?.core?.evalContext ??
    function evalContext(source: string) {
      try {
        return [indirectEval(source), null];
      } catch (err) {
        return [null, err];
      }
    }
);

export default evalContext;
