import { StringReader } from "https://deno.land/std@0.98.0/io/mod.ts";
import * as path from "https://deno.land/std@0.98.0/path/mod.ts";
import { pascalToCamel } from "../../misc/case.ts";
import { RpcType, Schema, Service } from "../../core/schema/model.ts";
import { createTypePathTree } from "../../core/schema/type-path-tree.ts";
import { CodeEntry } from "../index.ts";
import { CustomTypeMapping } from "./index.ts";
import { createImportBuffer, ImportBuffer } from "./import-buffer.ts";
import genIndex from "./genIndex.ts";
import { pbTypeToTsType } from "./messages.ts";

export default function* gen(
  schema: Schema,
  customTypeMapping: CustomTypeMapping,
): Generator<CodeEntry> {
  yield* genIndex({
    typePathTree: createTypePathTree(Object.keys(schema.services)),
    exists: (typePath) => typePath in schema.services,
    getIndexFilePath,
    getFilePath,
    itemIsExportedAs: "Service",
  });
  for (const [typePath, type] of Object.entries(schema.services)) {
    yield* genService(customTypeMapping, typePath, type);
  }
}

export function getIndexFilePath(typePath: string): string {
  return path.join("services", typePath.replaceAll(".", "/"), "index.ts");
}

export function getFilePath(typePath: string): string {
  return path.join("services", typePath.replaceAll(".", "/") + ".ts");
}

const reservedNames = ["Service", "Uint8Array"];
function* genService(
  customTypeMapping: CustomTypeMapping,
  typePath: string,
  type: Service,
): Generator<CodeEntry> {
  const filePath = getFilePath(typePath);
  const importBuffer = createImportBuffer(reservedNames);
  const serviceTypeDefCode = getServiceTypeDefCode(
    customTypeMapping,
    filePath,
    importBuffer,
    type,
  );
  const importCode = importBuffer.getCode();
  yield [
    filePath,
    new StringReader([
      importCode ? importCode + "\n" : "",
      serviceTypeDefCode,
    ].join("")),
  ];
}

function getServiceTypeDefCode(
  customTypeMapping: CustomTypeMapping,
  filePath: string,
  importBuffer: ImportBuffer,
  service: Service,
) {
  function getTsType(typePath?: string) {
    return pbTypeToTsType(
      customTypeMapping,
      importBuffer.addInternalImport,
      filePath,
      typePath,
    );
  }
  function getTsRpcType(rpcType: RpcType, isRes?: boolean): string {
    const typeName = getTsType(rpcType.typePath);
    if (rpcType.stream) return `AsyncGenerator<${typeName}>`;
    return isRes ? `Promise<${typeName}>` : typeName;
  }
  const serviceBodyCodes: string[] = [];
  const rpcs = Object.entries(service.rpcs);
  if (rpcs.length) serviceBodyCodes.push(getRpcsCode());
  if (!serviceBodyCodes.length) return `export interface Service {}\n`;
  return `export interface Service {\n${serviceBodyCodes.join("")}}\n`;
  function getRpcsCode() {
    return rpcs.map(([rpcName, rpc]) => {
      const reqType = getTsRpcType(rpc.reqType);
      const resType = getTsRpcType(rpc.resType, true);
      return `  ${pascalToCamel(rpcName)}(request: ${reqType}): ${resType};\n`;
    }).join("");
  }
}
