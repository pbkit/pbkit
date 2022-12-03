import { pascalToCamel } from "../../misc/case.ts";
import { RpcType, Schema, Service } from "../../core/schema/model.ts";
import { join } from "../path.ts";
import { GenMessagesConfig, GenServicesConfig } from "./index.ts";
import { CreateImportBufferFn, ImportBuffer } from "./import-buffer.ts";
import { IndexBuffer } from "./index-buffer.ts";
import {
  getFilePath as getMessageFilePath,
  pbTypeToTsMessageType,
} from "./messages.ts";
import {
  CodeFragment,
  Export,
  js,
  Module,
  ModuleFragment,
  ts,
} from "./code-fragment.ts";

export interface GenConfig {
  createImportBuffer: CreateImportBufferFn;
  indexBuffer: IndexBuffer;
  messages: GenMessagesConfig;
  services: GenServicesConfig;
}
export default function* gen(
  schema: Schema,
  config: GenConfig,
): Generator<Module> {
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
}: GenServiceConfig): Generator<Module> {
  const filePath = getFilePath(typePath, services);
  const importBuffer = createImportBuffer({ reservedNames });
  yield new Module(filePath, importBuffer)
    .add(getServiceTypeDefCode({
      filePath,
      importBuffer,
      service: type,
      messages,
    }))
    .add(getMethodDescriptorsCode({
      filePath,
      typePath,
      importBuffer,
      service: type,
      messages,
    }))
    .add(getCreateServiceClientCode({
      filePath,
      importBuffer,
      service: type,
    }));
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
}: GetServiceTypeDefCodeConfig): ModuleFragment[] {
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
  return [
    new Export(
      "Service",
      ts`interface Service<TReqArgs extends any[] = [], TResArgs extends any[] = []> {\n${getRpcsCode()}}`,
    ),
  ];
  function getRpcsCode() {
    const isServiceEmpty = Object.keys(service.rpcs).length < 1;
    if (isServiceEmpty) return "";
    const RpcReturnType = importBuffer.addRuntimeImport({
      here: filePath,
      from: "rpc.ts",
      item: "RpcReturnType",
      type: true,
    });
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
}: GetMethodDescriptorsCodeConfig): ModuleFragment[] {
  function getTsType(typePath?: string) {
    return pbTypeToTsMessageType({
      addInternalImport: importBuffer.addInternalImport,
      messages,
      here: filePath,
      typePath,
    });
  }
  return [
    new Export(
      "MethodDescriptors",
      ts`type MethodDescriptors = typeof methodDescriptors;`,
    ),
    new Export(
      "methodDescriptors",
      js([
        js`const methodDescriptors = {\n`,
        ...Object.entries(service.rpcs).map(([rpcName, rpc]) => {
          const camelRpcName = pascalToCamel(rpcName);
          const encodeRequestBinary = importBuffer.addInternalImport({
            here: filePath,
            from: getMessageFilePath(rpc.reqType.typePath!, messages),
            item: "encodeBinary",
          });
          const decodeRequestBinary = importBuffer.addInternalImport({
            here: filePath,
            from: getMessageFilePath(rpc.reqType.typePath!, messages),
            item: "decodeBinary",
          });
          const encodeRequestJson = importBuffer.addInternalImport({
            here: filePath,
            from: getMessageFilePath(rpc.reqType.typePath!, messages),
            item: "encodeJson",
          });
          const encodeResponseBinary = importBuffer.addInternalImport({
            here: filePath,
            from: getMessageFilePath(rpc.resType.typePath!, messages),
            item: "encodeBinary",
          });
          const decodeResponseBinary = importBuffer.addInternalImport({
            here: filePath,
            from: getMessageFilePath(rpc.resType.typePath!, messages),
            item: "decodeBinary",
          });
          const encodeResponseJson = importBuffer.addInternalImport({
            here: filePath,
            from: getMessageFilePath(rpc.resType.typePath!, messages),
            item: "encodeJson",
          });
          const reqTsType = getTsType(rpc.reqType.typePath);
          const resTsType = getTsType(rpc.resType.typePath);
          return js([
            js`  ${camelRpcName}: {\n`,
            js`    methodName: "${rpcName}",\n`,
            js`    service: { serviceName: "${typePath.slice(1)}" },\n`,
            js`    requestStream: ${rpc.reqType.stream ? "true" : "false"},\n`,
            js`    responseStream: ${rpc.resType.stream ? "true" : "false"},\n`,
            js`    requestType: {\n`,
            js`      serializeBinary: ${encodeRequestBinary},\n`,
            js`      deserializeBinary: ${decodeRequestBinary},\n`,
            js`      serializeJson: (value${ts`: ${reqTsType}`}) => JSON.stringify(${encodeRequestJson}(value)),\n`,
            js`    },\n`,
            js`    responseType: {\n`,
            js`      serializeBinary: ${encodeResponseBinary},\n`,
            js`      deserializeBinary: ${decodeResponseBinary},\n`,
            js`      serializeJson: (value${ts`: ${resTsType}`}) => JSON.stringify(${encodeResponseJson}(value)),\n`,
            js`    },\n`,
            js`  },\n`,
          ]);
        }),
        js`}${ts` as const`};`,
      ]),
    ),
  ];
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
}: GetCreateServiceClientCodeConfig): ModuleFragment[] {
  const RpcClientImpl = importBuffer.addRuntimeImport({
    here: filePath,
    from: "rpc.ts",
    item: "RpcClientImpl",
    type: true,
  });
  return [
    new Export(
      "RpcError",
      js([
        js`class RpcError${ts`<TTrailer = any>`} extends Error {\n`,
        ts`  trailer: Trailer;`,
        js`  constructor(trailer${ts`: TTrailer`}) {\n`,
        js`    super();\n`,
        js`    this.trailer = trailer;\n`,
        js`  }\n`,
        js`}`,
      ]),
    ),
    new Export(
      "CreateServiceClientConfig",
      ts([
        ts`interface CreateServiceClientConfig {\n`,
        ts`  responseOnly?: boolean;\n`,
        ts`  devtools?: true | { tags: string[] };\n`,
        ts`}`,
      ]),
    ),
    new Export(
      "createServiceClient",
      ts([
        ts`function createServiceClient<TMetadata, THeader, TTrailer>(\n`,
        ts`  rpcClientImpl: ${RpcClientImpl}<TMetadata, THeader, TTrailer>,\n`,
        ts`  config?: undefined\n`,
        ts`): Service<[] | [TMetadata], []>;`,
      ]),
    ),
    new Export(
      "createServiceClient",
      ts([
        ts`function createServiceClient<TMetadata, THeader, TTrailer>(\n`,
        ts`  rpcClientImpl: ${RpcClientImpl}<TMetadata, THeader, TTrailer>,\n`,
        ts`  config: CreateServiceClientConfig & { responseOnly: false }\n`,
        ts`): Service<[] | [TMetadata], [THeader, Promise<TTrailer>]>;`,
      ]),
    ),
    new Export(
      "createServiceClient",
      ts([
        ts`function createServiceClient<TMetadata, THeader, TTrailer>(\n`,
        ts`  rpcClientImpl: ${RpcClientImpl}<TMetadata, THeader, TTrailer>,\n`,
        ts`  config: CreateServiceClientConfig & { responseOnly?: true }\n`,
        ts`): Service<[] | [TMetadata], []>;`,
      ]),
    ),
    new Export(
      "createServiceClient",
      js([
        js`function createServiceClient${ts`<TMetadata, THeader, TTrailer>`}(\n`,
        js`  rpcClientImpl${ts`: ${RpcClientImpl}<TMetadata, THeader, TTrailer>`},\n`,
        js`  config${ts`?: CreateServiceClientConfig`}\n`,
        js`)${ts`: Service<[] | [TMetadata], [] | [THeader, Promise<TTrailer>]>`} ${getCreateServiceClientBody()}`,
      ]),
    ),
    js([
      js`function getHeaderBeforeTrailer${ts`<THeader, TTrailer>`}(\n`,
      js`  headerPromise${ts`: Promise<THeader>`},\n`,
      js`  trailerPromise${ts`: Promise<TTrailer>`}\n`,
      js`)${ts`: Promise<THeader>`} {\n`,
      js`  return Promise.race([\n`,
      js`    headerPromise,\n`,
      js`    trailerPromise.then(trailer => { throw new RpcError(trailer); }),\n`,
      js`  ]);\n`,
      js`}`,
    ]),
  ];
  function getCreateServiceClientBody(): CodeFragment {
    const isServiceEmpty = Object.keys(service.rpcs).length < 1;
    if (isServiceEmpty) return js`{\n  return {};\n}`;
    const MethodDescriptor = importBuffer.addRuntimeImport({
      here: filePath,
      from: "rpc.ts",
      item: "MethodDescriptor",
      type: true,
    });
    const fromSingle = importBuffer.addRuntimeImport({
      here: filePath,
      from: "async/async-generator.ts",
      item: "fromSingle",
    });
    const first = importBuffer.addRuntimeImport({
      here: filePath,
      from: "async/async-generator.ts",
      item: "first",
    });
    const wrapRpcClientImpl = importBuffer.addRuntimeImport({
      here: filePath,
      from: "client-devtools.ts",
      item: "wrapRpcClientImpl",
    });
    const getDevtoolsConfig = importBuffer.addRuntimeImport({
      here: filePath,
      from: "client-devtools.ts",
      item: "getDevtoolsConfig",
    });
    return js([
      js`{\n`,
      js`  let _rpcClientImpl = rpcClientImpl;\n`,
      js`  const responseOnly = config?.responseOnly ?? true;\n`,
      js`  const devtools = config?.devtools ?? false;\n`,
      js`  if (devtools) {\n`,
      js`    const tags = devtools === true ? [] : devtools.tags;\n`,
      js`    const devtoolsConfig = ${getDevtoolsConfig}();\n`,
      js`    _rpcClientImpl = ${wrapRpcClientImpl}({ rpcClientImpl, devtoolsConfig, tags });\n`,
      js`  }\n`,
      js`  return Object.fromEntries(Object.entries(methodDescriptors).map(\n`,
      js`    ([camelRpcName, methodDescriptor]) => {\n`,
      js`      const { requestStream, responseStream } = methodDescriptor;\n`,
      js`      const rpcMethodImpl = _rpcClientImpl(methodDescriptor${ts` as ${MethodDescriptor}<any, any>`});\n`,
      js`      const rpcMethodHandler = async (request${ts`: any`}, metadata${ts`?: any`}) => {\n`,
      js`        const reqAsyncGenerator = requestStream ? request : ${fromSingle}(request);\n`,
      js`        const rpcMethodResult = rpcMethodImpl(reqAsyncGenerator, metadata);\n`,
      js`        const resAsyncGenerator = rpcMethodResult[0];\n`,
      js`        const headerPromise = rpcMethodResult[1];\n`,
      js`        const trailerPromise = rpcMethodResult[2];\n`,
      js`        const [header, response] = await Promise.all([\n`,
      js`          getHeaderBeforeTrailer(headerPromise, trailerPromise),\n`,
      js`          responseStream ? resAsyncGenerator : ${first}(resAsyncGenerator),\n`,
      js`        ]);\n`,
      js`        return responseOnly ? response : [response, header, trailerPromise];\n`,
      js`      };\n`,
      js`      return [camelRpcName, rpcMethodHandler];\n`,
      js`    }\n`,
      js`  ))${ts` as unknown as Service`};\n`,
      js`}`,
    ]);
  }
}
