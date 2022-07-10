import { StringReader } from "https://deno.land/std@0.147.0/io/mod.ts";
import { pascalToCamel } from "../../misc/case.ts";
import { RpcType, Schema, Service } from "../../core/schema/model.ts";
import { join } from "../path.ts";
import { CodeEntry } from "../index.ts";
import { GenMessagesConfig, GenServicesConfig } from "./index.ts";
import { CreateImportBufferFn, ImportBuffer } from "./import-buffer.ts";
import { IndexBuffer } from "./index-buffer.ts";
import {
  getFilePath as getMessageFilePath,
  pbTypeToTsMessageType,
} from "./messages.ts";

export interface GenConfig {
  createImportBuffer: CreateImportBufferFn;
  indexBuffer: IndexBuffer;
  messages: GenMessagesConfig;
  services: GenServicesConfig;
}
export default function* gen(
  schema: Schema,
  config: GenConfig,
): Generator<CodeEntry> {
  const {
    createImportBuffer,
    indexBuffer,
    messages,
    services,
  } = config;
  for (const [typePath, type] of Object.entries(schema.services)) {
    indexBuffer.reExport(
      getFilePath(typePath, services, ""),
      "Service",
      typePath.split(".").pop()!,
    );
    yield* genService({
      typePath,
      type,
      createImportBuffer,
      messages,
      services,
    });
  }
}

export function getFilePath(
  typePath: string,
  services: GenServicesConfig,
  ext = ".ts",
): string {
  return join(
    services.outDir,
    typePath.replace(/^\./, "").replaceAll(".", "/") + ext,
  );
}

const reservedNames = ["Service", "Uint8Array"];

interface GenServiceConfig {
  typePath: string;
  type: Service;
  createImportBuffer: CreateImportBufferFn;
  messages: GenMessagesConfig;
  services: GenServicesConfig;
}
function* genService({
  typePath,
  type,
  createImportBuffer,
  messages,
  services,
}: GenServiceConfig): Generator<CodeEntry> {
  const filePath = getFilePath(typePath, services);
  const importBuffer = createImportBuffer({ reservedNames });
  const serviceTypeDefCode = getServiceTypeDefCode({
    filePath,
    importBuffer,
    service: type,
    messages,
  });
  const methodDescriptorsCode = getMethodDescriptorsCode({
    filePath,
    typePath,
    importBuffer,
    service: type,
    messages,
  });
  const createServiceClientCode = getCreateServiceClientCode({
    filePath,
    importBuffer,
    service: type,
  });
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

interface GetServiceTypeDefCodeConfig {
  filePath: string;
  importBuffer: ImportBuffer;
  messages: GenMessagesConfig;
  service: Service;
}
function getServiceTypeDefCode({
  filePath,
  importBuffer,
  messages,
  service,
}: GetServiceTypeDefCodeConfig) {
  function getTsType(typePath?: string) {
    return pbTypeToTsMessageType({
      addInternalImport: importBuffer.addInternalImport,
      messages,
      here: filePath,
      typePath,
    });
  }
  function getTsRpcType(rpcType: RpcType, isRes?: boolean): string {
    const typeName = getTsType(rpcType.typePath);
    if (rpcType.stream) return `AsyncGenerator<${typeName}>`;
    return isRes ? `Promise<${typeName}>` : typeName;
  }
  return `export interface Service<TReqArgs extends any[] = [], TResArgs extends any[] = []> {\n${getRpcsCode()}}\n`;
  function getRpcsCode() {
    const isServiceEmpty = Object.keys(service.rpcs).length < 1;
    if (isServiceEmpty) return "";
    const RpcReturnType = importBuffer.addRuntimeImport(
      filePath,
      "rpc.ts",
      "RpcReturnType",
    );
    return Object.entries(service.rpcs).map(([rpcName, rpc]) => {
      const reqType = getTsRpcType(rpc.reqType);
      const resType = getTsRpcType(rpc.resType, true);
      return `  ${
        pascalToCamel(rpcName)
      }(request: ${reqType}, ...args: TReqArgs): ${RpcReturnType}<${resType}, TResArgs>;\n`;
    }).join("");
  }
}

interface GetMethodDescriptorsCodeConfig {
  filePath: string;
  typePath: string;
  importBuffer: ImportBuffer;
  service: Service;
  messages: GenMessagesConfig;
}
function getMethodDescriptorsCode({
  filePath,
  typePath,
  importBuffer,
  service,
  messages,
}: GetMethodDescriptorsCodeConfig) {
  function getTsType(typePath?: string) {
    return pbTypeToTsMessageType({
      addInternalImport: importBuffer.addInternalImport,
      messages,
      here: filePath,
      typePath,
    });
  }
  return [
    "export type MethodDescriptors = typeof methodDescriptors;\n",
    "export const methodDescriptors = {\n",
    Object.entries(service.rpcs).map(([rpcName, rpc]) => {
      const camelRpcName = pascalToCamel(rpcName);
      const encodeRequestBinary = importBuffer.addInternalImport(
        filePath,
        getMessageFilePath(rpc.reqType.typePath!, messages),
        "encodeBinary",
      );
      const decodeRequestBinary = importBuffer.addInternalImport(
        filePath,
        getMessageFilePath(rpc.reqType.typePath!, messages),
        "decodeBinary",
      );
      const encodeRequestJson = importBuffer.addInternalImport(
        filePath,
        getMessageFilePath(rpc.reqType.typePath!, messages),
        "encodeJson",
      );
      const encodeResponseBinary = importBuffer.addInternalImport(
        filePath,
        getMessageFilePath(rpc.resType.typePath!, messages),
        "encodeBinary",
      );
      const decodeResponseBinary = importBuffer.addInternalImport(
        filePath,
        getMessageFilePath(rpc.resType.typePath!, messages),
        "decodeBinary",
      );
      const encodeResponseJson = importBuffer.addInternalImport(
        filePath,
        getMessageFilePath(rpc.resType.typePath!, messages),
        "encodeJson",
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
        `      serializeJson: (value: ${
          getTsType(rpc.reqType.typePath)
        }) => JSON.stringify(${encodeRequestJson}(value)),\n`,
        `    },\n`,
        `    responseType: {\n`,
        `      serializeBinary: ${encodeResponseBinary},\n`,
        `      deserializeBinary: ${decodeResponseBinary},\n`,
        `      serializeJson: (value: ${
          getTsType(rpc.resType.typePath)
        }) => JSON.stringify(${encodeResponseJson}(value)),\n`,
        `    },\n`,
        "  },\n",
      ].join("");
    }).join(""),
    "} as const;\n",
  ].join("");
}

interface GetCreateServiceClientCodeConfig {
  filePath: string;
  importBuffer: ImportBuffer;
  service: Service;
}
function getCreateServiceClientCode({
  filePath,
  importBuffer,
  service,
}: GetCreateServiceClientCodeConfig) {
  const RpcClientImpl = importBuffer.addRuntimeImport(
    filePath,
    "rpc.ts",
    "RpcClientImpl",
  );
  return `export class RpcError<TTrailer = any> extends Error {
  constructor(public trailer: TTrailer) { super(); }
}
export interface CreateServiceClientConfig {
  responseOnly?: boolean;
  devtools?: true | { tags: string[] };
}
export function createServiceClient<TMetadata, THeader, TTrailer>(
  rpcClientImpl: ${RpcClientImpl}<TMetadata, THeader, TTrailer>,
  config?: undefined
): Service<[] | [TMetadata], []>;
export function createServiceClient<TMetadata, THeader, TTrailer>(
  rpcClientImpl: ${RpcClientImpl}<TMetadata, THeader, TTrailer>,
  config: CreateServiceClientConfig & { responseOnly: false }
): Service<[] | [TMetadata], [THeader, Promise<TTrailer>]>;
export function createServiceClient<TMetadata, THeader, TTrailer>(
  rpcClientImpl: ${RpcClientImpl}<TMetadata, THeader, TTrailer>,
  config: CreateServiceClientConfig & { responseOnly?: true }
): Service<[] | [TMetadata], []>;
export function createServiceClient<TMetadata, THeader, TTrailer>(
  rpcClientImpl: ${RpcClientImpl}<TMetadata, THeader, TTrailer>,
  config?: CreateServiceClientConfig
): Service<[] | [TMetadata], [] | [THeader, Promise<TTrailer>]> ${getCreateServiceClientBody()}
`;
  function getCreateServiceClientBody() {
    const isServiceEmpty = Object.keys(service.rpcs).length < 1;
    if (isServiceEmpty) {
      return `{
  return {};
}`;
    }
    const MethodDescriptor = importBuffer.addRuntimeImport(
      filePath,
      "rpc.ts",
      "MethodDescriptor",
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
    const wrapRpcClientImpl = importBuffer.addRuntimeImport(
      filePath,
      "client-devtools.ts",
      "wrapRpcClientImpl",
    );
    const getDevtoolsConfig = importBuffer.addRuntimeImport(
      filePath,
      "client-devtools.ts",
      "getDevtoolsConfig",
    );
    return `{
  let _rpcClientImpl = rpcClientImpl;
  const responseOnly = config?.responseOnly ?? true;
  const devtools = config?.devtools ?? false;
  if (devtools) {
    const tags = devtools === true ? [] : devtools.tags;
    const devtoolsConfig = ${getDevtoolsConfig}();
    _rpcClientImpl = ${wrapRpcClientImpl}({ rpcClientImpl, devtoolsConfig, tags });
  }
  return Object.fromEntries(Object.entries(methodDescriptors).map(
    ([camelRpcName, methodDescriptor]) => {
      const { requestStream, responseStream } = methodDescriptor;
      const rpcMethodImpl = _rpcClientImpl(methodDescriptor as ${MethodDescriptor}<any, any>);
      const rpcMethodHandler = async (request: any, metadata?: any) => {
        const reqAsyncGenerator = requestStream ? request : ${fromSingle}(request);
        const rpcMethodResult = rpcMethodImpl(reqAsyncGenerator, metadata);
        const resAsyncGenerator = rpcMethodResult[0];
        const headerPromise = rpcMethodResult[1];
        const trailerPromise = rpcMethodResult[2];
        const [header, response] = await Promise.all([
          getHeaderBeforeTrailer(headerPromise, trailerPromise),
          responseStream ? resAsyncGenerator : ${first}(resAsyncGenerator),
        ]);
        return responseOnly ? response : [response, header, trailerPromise];
      };
      return [camelRpcName, rpcMethodHandler];
    }
  )) as unknown as Service;
}
function getHeaderBeforeTrailer<THeader, TTrailer>(
  headerPromise: Promise<THeader>,
  trailerPromise: Promise<TTrailer>
): Promise<THeader> {
  return Promise.race([
    headerPromise,
    trailerPromise.then(trailer => { throw new RpcError(trailer); }),
  ]);
}`;
  }
}
