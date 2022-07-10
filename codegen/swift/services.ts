import { StringReader } from "https://deno.land/std@0.147.0/io/readers.ts";
import { Rpc, Schema, Service } from "../../core/schema/model.ts";
import { CodeEntry } from "../index.ts";
import { join } from "../path.ts";
import {
  CustomTypeMapping,
  GenMessagesConfig,
  GenServicesConfig,
  getSwiftFullName,
  ServiceType,
  toSwiftName,
} from "./index.ts";
import { toCamelCase } from "./swift-protobuf/name.ts";

export interface GenConfig {
  customTypeMapping: CustomTypeMapping;
  services: GenServicesConfig;
}

export default function* gen(
  schema: Schema,
  config: GenConfig,
) {
  const { customTypeMapping, services } = config;
  const servicePaths = services.servicePaths ?? Object.keys(schema.services);
  for (const typePath of servicePaths) {
    const type = schema.services[typePath];
    yield* genService({
      typePath,
      type,
      customTypeMapping,
      schema,
      services,
    });
  }
}

export function getFilePath(
  typePath: string,
  services: GenServicesConfig,
  genType: ServiceType,
  ext = "swift",
): string {
  return join(
    services.outDir,
    [typePath.replace(/^\./, ""), genType, ext].join("."),
  );
}

interface GenServiceConfig {
  typePath: string;
  type: Service;
  schema: Schema;
  customTypeMapping: CustomTypeMapping;
  services: GenServicesConfig;
}
function* genService({
  typePath,
  type,
  customTypeMapping,
  schema,
  services,
}: GenServiceConfig): Generator<CodeEntry> {
  const serviceName = typePath.split(".").slice(1).join(".");
  const fragments = typePath.split(".").slice(1);
  const serviceSwiftName = fragments.map((fragment, index) =>
    fragments.length === index + 1
      ? fragment.charAt(0).toUpperCase() + fragment.slice(1)
      : toCamelCase(fragment, true)
  ).join("_");
  const getCodeConfig: GetCodeConfig = {
    type,
    schema,
    serviceName,
    swiftName: serviceSwiftName,
  };
  for (const genType of services.genTypes) {
    const filePath = getFilePath(typePath, services, genType);
    const importCode = getImportCode(genType);
    switch (genType) {
      case "grpc": {
        const protocolCode = getProtocolCode(getCodeConfig);
        const extensionCode = getProtocolExtensionCode(getCodeConfig);
        const clientInterceptorFactoryProtocolCode =
          getClientInterceptorFactoryProtocolCode(getCodeConfig);
        const clientCode = getClientCode(getCodeConfig);
        const providerCode = getProviderCode(getCodeConfig);
        const providerExtensionCode = getProviderExtensionCode(getCodeConfig);
        const factoryProtocolCode = getFactoryProtocolCode(getCodeConfig);
        yield [
          filePath,
          new StringReader([
            importCode,
            protocolCode,
            extensionCode,
            clientInterceptorFactoryProtocolCode,
            clientCode,
            providerCode,
            providerExtensionCode,
            factoryProtocolCode,
          ].join("\n")),
        ];
        return;
      }
      case "wrp": {
        const providerCode = getWrpProviderCode(getCodeConfig);
        const providerExtensionCode = getWrpProviderExtensionCode(
          getCodeConfig,
        );
        const clientCode = getWrpClientCode(getCodeConfig);
        const clientProtocolCode = getWrpClientProtocolCode(getCodeConfig);
        const clientProtocolExtensionCode = getWrpClientProtocolExtensionCode(
          getCodeConfig,
        );
        yield [
          filePath,
          new StringReader([
            importCode,
            clientCode,
            clientProtocolCode,
            clientProtocolExtensionCode,
            providerCode,
            providerExtensionCode,
          ].join("\n")),
        ];
        return;
      }
    }
  }
}

function getImportCode(type: ServiceType) {
  switch (type) {
    case "grpc":
      return getSwiftImportCode(["GRPC", "SwiftProtobuf", "NIO"]);
    case "wrp":
      return getSwiftImportCode(["GRPC", "SwiftProtobuf", "Wrp"]);
  }
  function getSwiftImportCode(deps: string[]) {
    return deps.map((dep) => `import ${dep}\n`).join("");
  }
}

interface GetCodeConfig {
  schema: Schema;
  type: Service;
  serviceName: string;
  swiftName: string;
}
type GetCodeFn = (config: GetCodeConfig) => string;
const getProtocolCode: GetCodeFn = ({
  type,
  schema,
  swiftName,
}) => {
  return [
    `internal protocol ${swiftName}ClientProtocol: GRPCClient {\n`,
    `  var serviceName: String { get }\n`,
    `  var interceptors: ${swiftName}ClientInterceptorFactoryProtocol? { get }\n`,
    Object.entries(type.rpcs).map(([rpcName, rpc]) => {
      const reqType = getSwiftFullName({
        schema,
        typePath: rpc.reqType.typePath,
      });
      const resType = getSwiftFullName({
        schema,
        typePath: rpc.resType.typePath,
      });
      const rpcCallType = getSwiftRpcCallType(rpc);
      return [
        "\n",
        `  func ${toSimpleCamelCase(rpcName)}(\n`,
        rpcCallType === "UnaryCall" ||
          rpcCallType === "ServerStreamingCall"
          ? `    _ request: ${reqType},\n`
          : "",
        `    callOptions: CallOptions?`,
        rpcCallType === "ServerStreamingCall" ||
          rpcCallType === "BidirectionalStreamingCall"
          ? `,\n    handler: @escaping (${resType}) -> Void`
          : "",
        `\n  ) -> ${rpcCallType}<${reqType}, ${resType}>\n`,
      ].join("");
    }).join(""),
    `}\n`,
  ].join("");
};

const getWrpClientProtocolCode: GetCodeFn = ({
  type,
  schema,
  swiftName,
}) => {
  return [
    `internal protocol ${swiftName}WrpClientProtocol {\n`,
    `  var client: WrpClient { get }\n`,
    Object.entries(type.rpcs).map(([rpcName, rpc]) => {
      const reqType = getSwiftFullName({
        schema,
        typePath: rpc.reqType.typePath,
      });
      const resType = getSwiftFullName({
        schema,
        typePath: rpc.resType.typePath,
      });
      const requestType = rpc.reqType.stream
        ? `AsyncStream<${reqType}>`
        : reqType;
      const responseType = rpc.resType.stream
        ? `WrpStreamingResponse<${resType}>`
        : `WrpUnaryResponse<${resType}>`;
      return [
        "\n",
        `  func ${toSimpleCamelCase(rpcName)}(\n`,
        `    _ request: ${requestType},\n`,
        `    callOptions: WrpClientCallOptions?`,
        `\n  ) throws -> ${responseType}\n`,
      ].join("");
    }).join(""),
    `}\n`,
  ].join("");
};

const getProtocolExtensionCode: GetCodeFn = ({
  schema,
  type,
  swiftName,
  serviceName,
}) => {
  return [
    `extension ${swiftName}WrpClientProtocol {\n`,
    `  public var serviceName: String {\n`,
    `    return "${serviceName}"\n`,
    `  }\n`,
    Object.entries(type.rpcs).map(([rpcName, rpc]) => {
      const reqType = getSwiftFullName({
        schema,
        typePath: rpc.reqType.typePath,
      });
      const resType = getSwiftFullName({
        schema,
        typePath: rpc.resType.typePath,
      });
      const rpcCallType = getSwiftRpcCallType(rpc);
      return [
        "\n",
        `  func ${toSimpleCamelCase(rpcName)}(\n`,
        (() => {
          switch (rpcCallType) {
            case "UnaryCall":
              return [
                `    _ request: ${reqType},\n`,
                `    callOptions: CallOptions? = nil\n`,
                `  ) -> ${rpcCallType}<${reqType}, ${resType}> {\n`,
                `    return self.make${rpcCallType}(\n`,
                `      path: "/${serviceName}/${rpcName}",\n`,
                `      request: request,\n`,
                `      callOptions: callOptions ?? self.defaultCallOptions,\n`,
                `      interceptors: self.interceptors?.make${rpcName}Interceptors() ?? []\n`,
              ].join("");
            case "ServerStreamingCall":
              return [
                `    _ request: ${reqType},\n`,
                `    callOptions: CallOptions? = nil,\n`,
                `    handler: @escaping (${resType}) -> Void\n`,
                `  ) -> ${rpcCallType}<${reqType}, ${resType}> {\n`,
                `    return self.make${rpcCallType}(\n`,
                `      path: "/${serviceName}/${rpcName}",\n`,
                `      request: request,\n`,
                `      callOptions: callOptions ?? self.defaultCallOptions,\n`,
                `      interceptors: self.interceptors?.make${rpcName}Interceptors() ?? [],\n`,
                `      handler: handler\n`,
              ].join("");
            case "ClientStreamingCall":
              return [
                `    callOptions: CallOptions? = nil\n`,
                `  ) -> ${rpcCallType}<${reqType}, ${resType}> {\n`,
                `    return self.make${rpcCallType}(\n`,
                `      path: "/${serviceName}/${rpcName}",\n`,
                `      callOptions: callOptions ?? self.defaultCallOptions,\n`,
                `      interceptors: self.interceptors?.make${rpcName}Interceptors() ?? []\n`,
              ].join("");
            case "BidirectionalStreamingCall":
              return [
                `    callOptions: CallOptions? = nil,\n`,
                `    handler: @escaping (${resType}) -> Void\n`,
                `  ) -> ${rpcCallType}<${reqType}, ${resType}> {\n`,
                `    return self.make${rpcCallType}(\n`,
                `      path: "/${serviceName}/${rpcName}",\n`,
                `      callOptions: callOptions ?? self.defaultCallOptions,\n`,
                `      interceptors: self.interceptors?.make${rpcName}Interceptors() ?? [],\n`,
                `      handler: handler\n`,
              ].join("");
            default:
              return "";
          }
        })(),
        `    )\n`,
        `  }\n`,
      ].join("");
    }).join(""),
    `}\n`,
  ].join("");
};

const getWrpClientProtocolExtensionCode: GetCodeFn = ({
  schema,
  type,
  swiftName,
  serviceName,
}) => {
  return [
    `extension ${swiftName}WrpClientProtocol {`,
    Object.entries(type.rpcs).map(([rpcName, rpc]) => {
      const reqType = getSwiftFullName({
        schema,
        typePath: rpc.reqType.typePath,
      });
      const resType = getSwiftFullName({
        schema,
        typePath: rpc.resType.typePath,
      });
      const rpcCallType = getSwiftRpcCallType(rpc);
      const requestType = rpc.reqType.stream
        ? `AsyncStream<${reqType}>`
        : reqType;
      const responseType = rpc.resType.stream
        ? "WrpStreamingResponse"
        : "WrpUnaryResponse";
      return [
        `\n  func ${toSimpleCamelCase(rpcName)}(\n`,
        (() => {
          switch (rpcCallType) {
            case "UnaryCall":
              return [
                `    _ request: ${requestType},\n`,
                `    callOptions: WrpClientCallOptions? = nil\n`,
                `  ) throws -> ${responseType}<${resType}> {\n`,
                `    return try self.client.make${rpcCallType}(\n`,
                `      path: "/${serviceName}/${rpcName}",\n`,
                `      request: request\n`,
              ].join("");
            case "ServerStreamingCall":
              return [
                `    _ request: ${requestType},\n`,
                `    callOptions: WrpClientCallOptions? = nil\n`,
                `  ) throws -> ${responseType}<${resType}> {\n`,
                `    return try self.client.make${rpcCallType}(\n`,
                `      path: "/${serviceName}/${rpcName}",\n`,
                `      request: request\n`,
              ].join("");
            case "ClientStreamingCall":
              return [
                `    _ request: ${requestType},\n`,
                `    callOptions: WrpClientCallOptions? = nil\n`,
                `  ) throws -> ${responseType}<${resType}> {\n`,
                `    return try self.client.make${rpcCallType}(\n`,
                `      path: "/${serviceName}/${rpcName}",\n`,
                `      request: request\n`,
              ].join("");
            case "BidirectionalStreamingCall":
              return [
                `    _ request: ${requestType},\n`,
                `    callOptions: WrpClientCallOptions? = nil\n`,
                `  ) throws -> ${responseType}<${resType}> {\n`,
                `    return try self.client.make${rpcCallType}(\n`,
                `      path: "/${serviceName}/${rpcName}",\n`,
                `      request: request\n`,
              ].join("");
            default:
              return "";
          }
        })(),
        `    )\n`,
        `  }\n`,
      ].join("");
    }).join(""),
    `}\n`,
  ].join("");
};

const getClientInterceptorFactoryProtocolCode: GetCodeFn = ({
  schema,
  type,
  swiftName,
}) => {
  return [
    `public protocol ${swiftName}ClientInterceptorFactoryProtocol {`,
    Object.entries(type.rpcs).map(([rpcName, rpc]) => {
      const reqType = getSwiftFullName({
        schema,
        typePath: rpc.reqType.typePath,
      });
      const resType = getSwiftFullName({
        schema,
        typePath: rpc.resType.typePath,
      });
      return [
        "\n",
        `  func make${rpcName}Interceptors() -> [ClientInterceptor<${reqType}, ${resType}>]\n`,
      ].join("");
    }).join(""),
    `}\n`,
  ].join("");
};

const getClientCode: GetCodeFn = ({ swiftName }) => {
  return [
    `public final class ${swiftName}Client: ${swiftName}ClientProtocol {\n`,
    `  public let channel: GRPCChannel\n`,
    `  public var defaultCallOptions: CallOptions\n`,
    `  public var interceptors: ${swiftName}ClientInterceptorFactoryProtocol?\n`,
    "\n",
    "  public init(\n",
    "    channel: GRPCChannel,\n",
    "    defaultCallOptions: CallOptions = CallOptions(),\n",
    `    interceptors: ${swiftName}ClientInterceptorFactoryProtocol? = nil\n`,
    "  ) {\n",
    "    self.channel = channel\n",
    "    self.defaultCallOptions = defaultCallOptions\n",
    "    self.interceptors = interceptors\n",
    "  }\n",
    "}\n",
  ].join("");
};

const getWrpClientCode: GetCodeFn = ({ swiftName }) => {
  return [
    `public final class ${swiftName}WrpClient: ${swiftName}WrpClientProtocol {\n`,
    `  public let client: WrpClient\n`,
    "\n",
    "  public init(\n",
    "    client: WrpClient\n",
    "  ) {\n",
    "    self.client = client\n",
    "  }\n",
    "}\n",
  ].join("");
};

const getProviderCode: GetCodeFn = ({ schema, type, swiftName }) => {
  return [
    `public protocol ${swiftName}Provider: CallHandlerProvider {\n`,
    `  var interceptors: ${swiftName}ServerInterceptorFactoryProtocol? { get }\n`,
    Object.entries(type.rpcs).map(
      ([rpcName, rpc]) => {
        const reqType = getSwiftFullName({
          schema,
          typePath: rpc.reqType.typePath,
        });
        const resType = getSwiftFullName({
          schema,
          typePath: rpc.resType.typePath,
        });
        const rpcCallType = getRpcCallType(rpc);
        switch (rpcCallType) {
          case "unary":
            return `\n  func ${
              toSimpleCamelCase(rpcName)
            }(request: ${reqType}, context: StatusOnlyCallContext) -> EventLoopFuture<${resType}>\n`;
          case "client":
            return `\n  func ${
              toSimpleCamelCase(rpcName)
            }(context: UnaryResponseCallContext<${resType}>) -> EventLoopFuture<(StreamEvent<${reqType}>) -> Void>\n`;
          case "server":
            return `\n  func ${
              toSimpleCamelCase(rpcName)
            }(request: ${reqType}, context: StreamingResponseCallContext<${resType}>) -> EventLoopFuture<GRPCStatus>\n`;
          case "bidi":
            return `\n  func ${
              toSimpleCamelCase(rpcName)
            }(context: StreamingResponseCallContext<${resType}>) -> EventLoopFuture<(StreamEvent<${reqType}>) -> Void>\n`;
        }
      },
    ).join(""),
    `}\n`,
  ].join("");
};

const getWrpProviderCode: GetCodeFn = ({ schema, type, swiftName }) => {
  return [
    `public protocol ${swiftName}WrpProvider: WrpServiceProvider {`,
    Object.entries(type.rpcs).map(
      ([rpcName, rpc]) => {
        const reqType = getSwiftFullName({
          schema,
          typePath: rpc.reqType.typePath,
        });
        const resType = getSwiftFullName({
          schema,
          typePath: rpc.resType.typePath,
        });
        return `\n  func ${
          toSimpleCamelCase(rpcName)
        }(request: AsyncStream<${reqType}>, context: WrpRequestContext<${resType}>) async\n`;
      },
    ).join(""),
    `}\n`,
  ].join("");
};

const getProviderExtensionCode: GetCodeFn = (
  { schema, type, swiftName, serviceName },
) => {
  return [
    `extension ${swiftName}Provider {\n`,
    `  public var serviceName: Substring { return "${serviceName}" }\n`,
    "\n",
    "  public func handle(\n",
    "    method name: Substring,\n",
    "    context: CallHandlerContext\n",
    "  ) -> GRPCServerHandlerProtocol? {\n",
    "    switch name {\n",
    Object.entries(type.rpcs).map(([rpcName, rpc]) => {
      const reqType = getSwiftFullName({
        schema,
        typePath: rpc.reqType.typePath,
      });
      const resType = getSwiftFullName({
        schema,
        typePath: rpc.resType.typePath,
      });
      const rpcHandlerType = getSwiftRpcHandlerType(rpc);
      return [
        `    case "${rpcName}":\n`,
        `      return ${rpcHandlerType}(\n`,
        "        context: context,\n",
        `        requestDeserializer: ProtobufDeserializer<${reqType}>(),\n`,
        `        responseSerializer: ProtobufSerializer<${resType}>(),\n`,
        `        interceptors: self.interceptors?.make${
          toSimpleUpperCase(rpcName)
        }Interceptors() ?? [],\n`,
        rpcHandlerType === "ClientStreamingServerHandler" ||
          rpcHandlerType === "BidirectionalStreamingServerHandler"
          ? `        observerFactory: self.${
            toSimpleCamelCase(rpcName)
          }(context:)\n`
          : `        userFunction: self.${
            toSimpleCamelCase(rpcName)
          }(request:context:)\n`,
        "      )\n\n",
      ].join("");
    }).join(""),
    `    default:\n`,
    `      return nil\n`,
    `    }\n`,
    "  }\n",
    "}\n",
  ].join("");
};

const getWrpProviderExtensionCode: GetCodeFn = (
  { schema, type, swiftName, serviceName },
) => {
  return [
    `public extension ${swiftName}WrpProvider {\n`,
    `  var serviceName: Substring { return "${serviceName}" }\n\n`,
    `  var methodNames: [Substring] { return [${
      Object.entries(type.rpcs).map(([rpcName]) => `"${rpcName}"`).join(", ")
    }] }\n\n`,
    "  func handle(\n",
    "    method name: Substring,\n",
    "    context: WrpRequestHandlerContext\n",
    "  ) -> WrpRequestHandlerProtocol? {\n",
    "    switch name {\n",
    Object.entries(type.rpcs).map(([rpcName, rpc]) => {
      const reqType = getSwiftFullName({
        schema,
        typePath: rpc.reqType.typePath,
      });
      const resType = getSwiftFullName({
        schema,
        typePath: rpc.resType.typePath,
      });
      return [
        `    case "${rpcName}":\n`,
        `      return WrpRequestHandler(\n`,
        "        context: context,\n",
        `        requestDeserializer: ProtobufDeserializer<${reqType}>(),\n`,
        `        responseSerializer: ProtobufSerializer<${resType}>(),\n`,
        `        userFunction: self.${
          toSimpleCamelCase(rpcName)
        }(request:context:)\n`,
        "      )\n\n",
      ].join("");
    }).join(""),
    `    default:\n`,
    `      return nil\n`,
    `    }\n`,
    "  }\n",
    "}\n",
  ].join("");
};

type RpcCallType = "unary" | "server" | "client" | "bidi";
function getRpcCallType({ reqType, resType }: Rpc): RpcCallType {
  if (reqType.stream) {
    if (resType.stream) return "bidi";
    return "client";
  }
  if (resType.stream) return "server";
  return "unary";
}
type SwiftRpcCallType =
  | "UnaryCall"
  | "ServerStreamingCall"
  | "ClientStreamingCall"
  | "BidirectionalStreamingCall";
function getSwiftRpcCallType(rpc: Rpc): SwiftRpcCallType {
  switch (getRpcCallType(rpc)) {
    case "unary":
      return "UnaryCall";
    case "client":
      return "ClientStreamingCall";
    case "server":
      return "ServerStreamingCall";
    case "bidi":
      return "BidirectionalStreamingCall";
  }
}

type SwiftRpcHandlerType =
  | "UnaryServerHandler"
  | "ServerStreamingServerHandler"
  | "ClientStreamingServerHandler"
  | "BidirectionalStreamingServerHandler";
function getSwiftRpcHandlerType(rpc: Rpc): SwiftRpcHandlerType {
  switch (getRpcCallType(rpc)) {
    case "unary":
      return "UnaryServerHandler";
    case "client":
      return "ClientStreamingServerHandler";
    case "server":
      return "ServerStreamingServerHandler";
    case "bidi":
      return "BidirectionalStreamingServerHandler";
  }
}

const getFactoryProtocolCode: GetCodeFn = ({ schema, type, swiftName }) => {
  return [
    `public protocol ${swiftName}ServerInterceptorFactoryProtocol {`,
    Object.entries(type.rpcs).map(([rpcName, rpc]) => {
      const reqType = getSwiftFullName({
        schema,
        typePath: rpc.reqType.typePath,
      });
      const resType = getSwiftFullName({
        schema,
        typePath: rpc.resType.typePath,
      });
      return `\n  func make${
        toSimpleUpperCase(rpcName)
      }Interceptors() -> [ServerInterceptor<${reqType}, ${resType}>]\n`;
    }).join(""),
    `}\n`,
  ].join("");
};

function toSimpleUpperCase(str: string) {
  return str[0].toUpperCase() + str.slice(1);
}

function toSimpleCamelCase(str: string) {
  return str[0].toLowerCase() + str.slice(1);
}
