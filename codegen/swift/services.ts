import { StringReader } from "https://deno.land/std@0.122.0/io/readers.ts";
import { Schema, Service } from "../../core/schema/model.ts";
import { CodeEntry } from "../index.ts";
import { join } from "../path.ts";
import {
  CustomTypeMapping,
  GenMessagesConfig,
  GenServicesConfig,
  getSwiftFullName,
  toSwiftName,
} from "./index.ts";
import { toCamelCase } from "./swift-protobuf/name.ts";

export interface GenConfig {
  customTypeMapping: CustomTypeMapping;
  messages: GenMessagesConfig;
  services: GenServicesConfig;
}

export default function* gen(
  schema: Schema,
  config: GenConfig,
) {
  const { customTypeMapping, messages, services } = config;
  for (const [typePath, type] of Object.entries(schema.services)) {
    yield* genService({
      typePath,
      type,
      customTypeMapping,
      schema,
      messages,
      services,
    });
  }
}

export function getFilePath(
  typePath: string,
  services: GenServicesConfig,
  ext = ".grpc.swift",
): string {
  return join(
    services.outDir,
    typePath.replace(/^\./, "") + ext,
  );
}

interface GenServiceConfig {
  typePath: string;
  type: Service;
  schema: Schema;
  customTypeMapping: CustomTypeMapping;
  messages: GenMessagesConfig;
  services: GenServicesConfig;
}
function* genService({
  typePath,
  type,
  customTypeMapping,
  schema,
  messages,
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
  const filePath = getFilePath(typePath, services);
  const importCode = getImportCode();
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
      "\n",
      protocolCode,
      "\n",
      extensionCode,
      "\n",
      clientInterceptorFactoryProtocolCode,
      "\n",
      clientCode,
      "\n",
      providerCode,
      "\n",
      providerExtensionCode,
      "\n",
      factoryProtocolCode,
    ].join("")),
  ];
}

function getImportCode() {
  return [
    `import GRPC\n`,
    `import NIO\n`,
    `import SwiftProtobuf\n`,
  ].join("");
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
    `public protocol ${swiftName}ClientProtocol: GRPCClient {\n`,
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
      return [
        "\n",
        `  func ${toSimpleCamelCase(rpcName)}(\n`,
        `    _ request: ${reqType},\n`,
        `    callOptions: CallOptions?\n`,
        `  ) -> UnaryCall<${reqType}, ${resType}>\n`, // @TODO(hyp3rflow): add other call type
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
    `extension ${swiftName}ClientProtocol {\n`,
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
      return [
        "\n",
        `  public func ${toSimpleCamelCase(rpcName)}(\n`,
        `    _ request: ${reqType},\n`,
        `    callOptions: CallOptions? = nil\n`,
        `  ) -> UnaryCall<${reqType}, ${resType}> {\n`,
        `    return self.makeUnaryCall(\n`,
        `      path: "/${serviceName}/${rpcName}",\n`,
        `      request: request,\n`,
        `      callOptions: callOptions ?? self.defaultCallOptions,\n`,
        `      interceptors: self.interceptors?.make${rpcName}Interceptors() ?? []\n`,
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
        return `\n  func ${
          toSimpleCamelCase(rpcName)
        }(request: ${reqType}, context: StatusOnlyCallContext) -> EventLoopFuture<${resType}>\n`;
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
      return [
        `    case "${rpcName}":\n`,
        `      return UnaryServerHandler(\n`,
        "        context: context,\n",
        `        requestDeserializer: ProtobufDeserializer<${reqType}>(),\n`,
        `        responseSerializer: ProtobufSerializer<${resType}>(),\n`,
        `        interceptors: self.interceptors?.make${
          toSimpleUpperCase(rpcName)
        }Interceptors() ?? [],\n`,
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
