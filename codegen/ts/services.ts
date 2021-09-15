import { StringReader } from "https://deno.land/std@0.101.0/io/mod.ts";
import * as path from "https://deno.land/std@0.101.0/path/mod.ts";
import { pascalToCamel } from "../../misc/case.ts";
import { RpcType, Schema, Service } from "../../core/schema/model.ts";
import { createTypePathTree } from "../../core/schema/type-path-tree.ts";
import { CodeEntry } from "../index.ts";
import { CustomTypeMapping } from "./index.ts";
import { createImportBuffer, ImportBuffer } from "./import-buffer.ts";
import genIndex from "./genIndex.ts";
import {
  getFilePath as getMessageFilePath,
  pbTypeToTsType,
} from "./messages.ts";

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
  const createServiceClientCode = getCreateServiceClientCode(
    filePath,
    typePath,
    importBuffer,
    type,
  );
  yield [
    filePath,
    new StringReader([
      importBuffer.getCode() + "\n",
      serviceTypeDefCode + "\n",
      createServiceClientCode,
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
  return `export interface Service<TArgs extends any[] = []> {\n${getRpcsCode()}}\n`;
  function getRpcsCode() {
    return Object.entries(service.rpcs).map(([rpcName, rpc]) => {
      const reqType = getTsRpcType(rpc.reqType);
      const resType = getTsRpcType(rpc.resType, true);
      return `  ${
        pascalToCamel(rpcName)
      }(request: ${reqType}, ...args: TArgs): ${resType};\n`;
    }).join("");
  }
}

function getCreateServiceClientCode(
  filePath: string,
  typePath: string,
  importBuffer: ImportBuffer,
  service: Service,
) {
  const RpcImpl = importBuffer.addInternalImport(
    filePath,
    "runtime/rpc.ts",
    "RpcImpl",
  );
  const singleValueToAsyncGenerator = importBuffer.addInternalImport(
    filePath,
    "runtime/rpc.ts",
    "singleValueToAsyncGenerator",
  );
  const getFirstValueFromAsyncGenerator = importBuffer.addInternalImport(
    filePath,
    "runtime/rpc.ts",
    "getFirstValueFromAsyncGenerator",
  );
  return [
    `export function createServiceClient<TMetadata>(rpcImpl: ${RpcImpl}<TMetadata>): Service<[] | [TMetadata]> {\n`,
    "  return {\n",
    Object.entries(service.rpcs).map(([rpcName, rpc]) => {
      const camelRpcName = pascalToCamel(rpcName);
      const encodeRequestBinary = importBuffer.addInternalImport(
        filePath,
        getMessageFilePath(rpc.reqType.typePath!),
        "encodeBinary",
      );
      const decodeRequestBinary = importBuffer.addInternalImport(
        filePath,
        getMessageFilePath(rpc.reqType.typePath!),
        "decodeBinary",
      );
      const encodeResponseBinary = importBuffer.addInternalImport(
        filePath,
        getMessageFilePath(rpc.resType.typePath!),
        "encodeBinary",
      );
      const decodeResponseBinary = importBuffer.addInternalImport(
        filePath,
        getMessageFilePath(rpc.resType.typePath!),
        "decodeBinary",
      );

      if (!rpc.reqType.stream && !rpc.resType.stream) {
        return [
          `    async ${camelRpcName}(request, metadata?) {\n`,
          `      const ${camelRpcName}Rpc = rpcImpl(\n`,
          `        "${typePath.substr(1)}",\n`,
          `        "${rpcName}",\n`,
          `        {\n`,
          `          encodeRequestBinary: ${encodeRequestBinary},\n`,
          `          decodeRequestBinary: ${decodeRequestBinary},\n`,
          `          encodeResponseBinary: ${encodeResponseBinary},\n`,
          `          decodeResponseBinary: ${decodeResponseBinary},\n`,
          "        }\n",
          "      );\n",
          `      const reqAsyncGenerator = ${singleValueToAsyncGenerator}(request);\n`,
          `      const resAsyncGenerator = ${camelRpcName}Rpc(reqAsyncGenerator, metadata);\n`,
          `      return await ${getFirstValueFromAsyncGenerator}(resAsyncGenerator);\n`,
          "    },\n",
        ].join("");
      }
      if (rpc.reqType.stream && rpc.resType.stream) {
        return [
          `    ${camelRpcName}(request, metadata?) {\n`,
          "      // TODO\n",
          "    },\n",
        ].join("");
      }
      if (!rpc.reqType.stream && rpc.resType.stream) {
        return [
          `    ${camelRpcName}(request, metadata?) {\n`,
          "      // TODO\n",
          "    },\n",
        ].join("");
      }
      if (rpc.reqType.stream && !rpc.resType.stream) {
        return [
          `    ${camelRpcName}(request, metadata?) {\n`,
          "      // TODO\n",
          "    },\n",
        ].join("");
      }
      return "";
    }).join(""),
    "  };\n",
    "}\n",
  ].join("");
}
