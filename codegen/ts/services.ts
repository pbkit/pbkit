import { StringReader } from "https://deno.land/std@0.107.0/io/mod.ts";
import * as path from "https://deno.land/std@0.107.0/path/mod.ts";
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
  const methodDescriptorsCode = getMethodDescriptorsCode(
    filePath,
    typePath,
    importBuffer,
    type,
  );
  const RpcClientImpl = importBuffer.addInternalImport(
    filePath,
    "runtime/rpc.ts",
    "RpcClientImpl",
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
  const createServiceClientCode = getCreateServiceClientCode(
    RpcClientImpl,
    singleValueToAsyncGenerator,
    getFirstValueFromAsyncGenerator,
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
  const RpcReturnType = importBuffer.addInternalImport(
    filePath,
    "runtime/rpc.ts",
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
  const MethodDescriptor = importBuffer.addInternalImport(
    filePath,
    "runtime/rpc.ts",
    "MethodDescriptor",
  );
  return [
    `export const methodDescriptors: { [methodName in keyof Service]: ${MethodDescriptor}<any, any> } = {\n`,
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
    "};\n",
  ].join("");
}

const getCreateServiceClientCode = (
  RpcClientImpl: string,
  singleValueToAsyncGenerator: string,
  getFirstValueFromAsyncGenerator: string,
) => (`export interface CreateServiceClientConfig {
  ignoreResMetadata?: boolean;
}
export function createServiceClient<TReqMetadata, TResMetadata>(
  rpcClientImpl: ${RpcClientImpl}<TReqMetadata, TResMetadata>,
  config?: undefined
): Service<[] | [TReqMetadata], [Promise<TResMetadata>]>;
export function createServiceClient<TReqMetadata, TResMetadata>(
  rpcClientImpl: ${RpcClientImpl}<TReqMetadata, TResMetadata>,
  config: CreateServiceClientConfig & { ignoreResMetadata?: false | undefined }
): Service<[] | [TReqMetadata], [Promise<TResMetadata>]>;
export function createServiceClient<TReqMetadata, TResMetadata>(
  rpcClientImpl: ${RpcClientImpl}<TReqMetadata, TResMetadata>,
  config: CreateServiceClientConfig & { ignoreResMetadata: true }
): Service<[] | [TReqMetadata], []>;
export function createServiceClient<TReqMetadata, TResMetadata>(
  rpcClientImpl: ${RpcClientImpl}<TReqMetadata, TResMetadata>,
  config?: CreateServiceClientConfig
): Service<[] | [TReqMetadata], [] | [Promise<TResMetadata>]> {
  return Object.fromEntries(Object.entries(methodDescriptors).map(
    ([camelRpcName, methodDescriptor]) => [
      camelRpcName,
      (request: any, metadata?: any) => {
        const reqAsyncGenerator = methodDescriptor.requestStream ? request : ${singleValueToAsyncGenerator}(request);
        const [resAsyncGenerator, resMetadataPromise] = rpcClientImpl(methodDescriptor)(reqAsyncGenerator, metadata);
        const response = methodDescriptor.responseStream ? resAsyncGenerator : ${getFirstValueFromAsyncGenerator}(resAsyncGenerator);
        if (config?.ignoreResMetadata) return response;
        return [response, resMetadataPromise];
      },
    ]
  )) as unknown as Service;
}
`);
