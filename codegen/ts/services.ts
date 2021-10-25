import { StringReader } from "https://deno.land/std@0.107.0/io/mod.ts";
import { pascalToCamel } from "../../misc/case.ts";
import { RpcType, Schema, Service } from "../../core/schema/model.ts";
import { createTypePathTree } from "../../core/schema/type-path-tree.ts";
import { join } from "../path.ts";
import { CodeEntry } from "../index.ts";
import { CustomTypeMapping } from "./index.ts";
import { CreateImportBufferFn, ImportBuffer } from "./import-buffer.ts";
import genIndex from "./genIndex.ts";
import {
  getFilePath as getMessageFilePath,
  pbTypeToTsType,
} from "./messages.ts";

export interface GenConfig {
  createImportBuffer: CreateImportBufferFn;
  customTypeMapping: CustomTypeMapping;
}
export default function* gen(
  schema: Schema,
  config: GenConfig,
): Generator<CodeEntry> {
  const { createImportBuffer, customTypeMapping } = config;
  yield* genIndex({
    typePathTree: createTypePathTree(Object.keys(schema.services)),
    exists: (typePath) => typePath in schema.services,
    getIndexFilePath,
    getFilePath,
    itemIsExportedAs: "Service",
  });
  for (const [typePath, type] of Object.entries(schema.services)) {
    yield* genService({
      typePath,
      type,
      createImportBuffer,
      customTypeMapping,
    });
  }
}

export function getIndexFilePath(typePath: string): string {
  return join("services", typePath.replaceAll(".", "/"), "index.ts");
}

export function getFilePath(typePath: string): string {
  return join("services", typePath.replaceAll(".", "/") + ".ts");
}

const reservedNames = ["Service", "Uint8Array"];

interface GenServiceConfig {
  typePath: string;
  type: Service;
  createImportBuffer: CreateImportBufferFn;
  customTypeMapping: CustomTypeMapping;
}
function* genService({
  typePath,
  type,
  customTypeMapping,
  createImportBuffer,
}: GenServiceConfig): Generator<CodeEntry> {
  const filePath = getFilePath(typePath);
  const importBuffer = createImportBuffer({ reservedNames });
  const serviceTypeDefCode = getServiceTypeDefCode(
    customTypeMapping,
    filePath,
    importBuffer,
    type,
  );
  const methodDescriptorsCode = getMethodDescriptorsCode(
    filePath,
    typePath,
    importBuffer,
    type,
  );
  const RpcClientImpl = importBuffer.addRuntimeImport(
    filePath,
    "rpc.ts",
    "RpcClientImpl",
  );
  const fromSingle = importBuffer.addRuntimeImport(
    filePath,
    "async/async-generator.ts",
    "fromSingle",
  );
  const first = importBuffer.addRuntimeImport(
    filePath,
    "async/async-generator.ts",
    "first",
  );
  const createServiceClientCode = getCreateServiceClientCode(
    RpcClientImpl,
    fromSingle,
    first,
  );
  yield [
    filePath,
    new StringReader([
      importBuffer.getCode() + "\n",
      serviceTypeDefCode + "\n",
      methodDescriptorsCode + "\n",
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
  const RpcReturnType = importBuffer.addRuntimeImport(
    filePath,
    "rpc.ts",
    "RpcReturnType",
  );
  return `export interface Service<TReqArgs extends any[] = [], TResArgs extends any[] = []> {\n${getRpcsCode()}}\n`;
  function getRpcsCode() {
    return Object.entries(service.rpcs).map(([rpcName, rpc]) => {
      const reqType = getTsRpcType(rpc.reqType);
      const resType = getTsRpcType(rpc.resType, true);
      return `  ${
        pascalToCamel(rpcName)
      }(request: ${reqType}, ...args: TReqArgs): ${RpcReturnType}<${resType}, TResArgs>;\n`;
    }).join("");
  }
}

function getMethodDescriptorsCode(
  filePath: string,
  typePath: string,
  importBuffer: ImportBuffer,
  service: Service,
) {
  return [
    "export type MethodDescriptors = typeof methodDescriptors;\n",
    "export const methodDescriptors = {\n",
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
      return [
        `  ${camelRpcName}: {\n`,
        `    methodName: "${rpcName}",\n`,
        `    service: { serviceName: "${typePath.substr(1)}" },\n`,
        `    requestStream: ${rpc.reqType.stream ? "true" : "false"},\n`,
        `    responseStream: ${rpc.resType.stream ? "true" : "false"},\n`,
        `    requestType: {\n`,
        `      serializeBinary: ${encodeRequestBinary},\n`,
        `      deserializeBinary: ${decodeRequestBinary},\n`,
        `    },\n`,
        `    responseType: {\n`,
        `      serializeBinary: ${encodeResponseBinary},\n`,
        `      deserializeBinary: ${decodeResponseBinary},\n`,
        `    },\n`,
        "  },\n",
      ].join("");
    }).join(""),
    "} as const;\n",
  ].join("");
}

const getCreateServiceClientCode = (
  RpcClientImpl: string,
  fromSingle: string,
  first: string,
) => (`export class RpcError<TTrailer = any> extends Error {
  constructor(public trailer: TTrailer) { super(); }
}
export interface CreateServiceClientConfig {
  responseOnly?: boolean;
}
export function createServiceClient<TMetadata, THeader, TTrailer>(
  rpcClientImpl: ${RpcClientImpl}<TMetadata, THeader, TTrailer>,
  config?: undefined
): Service<[] | [TMetadata], [THeader, Promise<TTrailer>]>;
export function createServiceClient<TMetadata, THeader, TTrailer>(
  rpcClientImpl: ${RpcClientImpl}<TMetadata, THeader, TTrailer>,
  config: CreateServiceClientConfig & { responseOnly?: false | undefined }
): Service<[] | [TMetadata], [THeader, Promise<TTrailer>]>;
export function createServiceClient<TMetadata, THeader, TTrailer>(
  rpcClientImpl: ${RpcClientImpl}<TMetadata, THeader, TTrailer>,
  config: CreateServiceClientConfig & { responseOnly: true }
): Service<[] | [TMetadata], []>;
export function createServiceClient<TMetadata, THeader, TTrailer>(
  rpcClientImpl: ${RpcClientImpl}<TMetadata, THeader, TTrailer>,
  config?: CreateServiceClientConfig
): Service<[] | [TMetadata], [] | [THeader, Promise<TTrailer>]> {
  return Object.fromEntries(Object.entries(methodDescriptors).map(
    ([camelRpcName, methodDescriptor]) => [
      camelRpcName,
      async (request: any, metadata?: any) => {
        const reqAsyncGenerator = methodDescriptor.requestStream ? request : ${fromSingle}(request);
        const [resAsyncGenerator, headerPromise, trailerPromise] = rpcClientImpl(methodDescriptor)(reqAsyncGenerator, metadata);
        const response = methodDescriptor.responseStream ? resAsyncGenerator : ${first}(resAsyncGenerator);
        const header = await Promise.race([
          headerPromise,
          trailerPromise.then(trailer => { throw new RpcError(trailer); }),
        ]);
        const result = [await response, header, trailerPromise];
        if (config?.responseOnly) return result[0];
        return result;
      },
    ]
  )) as unknown as Service;
}
`);
