import { basename } from "https://deno.land/std@0.147.0/path/mod.ts";
import { StringReader } from "https://deno.land/std@0.147.0/io/mod.ts";
import { Rpc, RpcType, Schema, Service } from "../../core/schema/model.ts";
import { pascalToCamel } from "../../misc/case.ts";
import { CodeEntry } from "../index.ts";

export interface GenConfig {
  hostServicePaths: Set<`.${string}`>;
  guestServicePaths: Set<`.${string}`>;
}
export default async function* gen(
  schema: Schema,
  config: GenConfig,
): AsyncGenerator<CodeEntry> {
  const { hostServicePaths, guestServicePaths } = config;
  const servicePaths = new Set([...hostServicePaths, ...guestServicePaths]);
  for (const servicePath of servicePaths) {
    yield genWrpService(
      schema,
      servicePath,
      hostServicePaths.has(servicePath),
      guestServicePaths.has(servicePath),
    );
  }
}

export function genWrpService(
  schema: Schema,
  servicePath: `.${string}`,
  host: boolean,
  guest: boolean,
): CodeEntry {
  const service = schema.services[servicePath];
  const javaPackage = getJavaPackage(schema, service.filePath);
  const serviceName = servicePath.split(".").pop()!;
  function getMethodString(rpcName: string): string {
    return `"${servicePath.slice(1)}/${rpcName}"`;
  }
  const context: GenWrpServiceContext = {
    schema,
    service,
    serviceName,
    getMethodString,
  };
  return [
    `${javaPackage.replaceAll(".", "/")}/${serviceName}.kt`,
    new StringReader([
      `package ${javaPackage}\n`,
      "\n",
      "import dev.pbkit.wrp.core.WrpGuest\n",
      "import dev.pbkit.wrp.core.WrpRequest\n",
      "import dev.pbkit.wrp.core.WrpServer\n",
      "import kotlinx.coroutines.channels.Channel\n",
      "import kotlinx.coroutines.channels.ReceiveChannel\n",
      "import kotlinx.coroutines.coroutineScope\n",
      "import kotlinx.coroutines.launch\n",
      "\n",
      [
        genWrpServiceInterface(context),
        guest && genWrpServiceClass(context),
        host && genWrpServiceServeFunction(context),
      ].filter(Boolean).join("\n"),
    ].join("")),
  ];
}

interface GenWrpServiceContext {
  schema: Schema;
  service: Service;
  serviceName: string;
  getMethodString: (rpcName: string) => string;
}

function getMethodSignature(schema: Schema, rpcName: string, rpc: Rpc): string {
  const { reqType, resType } = rpc;
  const reqTypeKt = rpcTypeToKt(schema, reqType);
  const resTypeKt = rpcTypeToKt(schema, resType);
  const camelRpcName = pascalToCamel(rpcName);
  if (!reqType.stream && !resType.stream) {
    return `suspend fun ${camelRpcName}(req: ${reqTypeKt}): ${resTypeKt}`;
  } else if (!reqType.stream && resType.stream) {
    return `suspend fun ${camelRpcName}(req: ${reqTypeKt}): ReceiveChannel<${resTypeKt}>`;
  } else if (reqType.stream && !resType.stream) {
    return `suspend fun ${camelRpcName}(req: ReceiveChannel<${reqTypeKt}>): ${resTypeKt}`;
  } else {
    return `suspend fun ${camelRpcName}(req: ReceiveChannel<${reqTypeKt}>): ReceiveChannel<${resTypeKt}>`;
  }
}

function genWrpServiceInterface(
  { schema, service, serviceName }: GenWrpServiceContext,
): string {
  return [
    `interface ${serviceName} {\n`,
    Object.entries(service.rpcs).map(
      ([rpcName, rpc]) => `    ${getMethodSignature(schema, rpcName, rpc)}\n`,
    ).join(""),
    "}\n",
  ].join("");
}

function genWrpServiceClass(
  { schema, service, serviceName, getMethodString }: GenWrpServiceContext,
): string {
  return [
    `class Wrp${serviceName} constructor(private val wrpGuest: WrpGuest) : ${serviceName} {\n`,
    Object.entries(service.rpcs).map(([rpcName, rpc]) => {
      const resTypeKt = rpcTypeToKt(schema, rpc.resType);
      const reqStream = rpc.reqType.stream;
      const resStream = rpc.resType.stream;
      const methodSignature = getMethodSignature(schema, rpcName, rpc);
      return [
        `    override ${methodSignature} {\n`,
        "        val reqChannel = Channel<ByteArray>()\n",
        resStream
          ? `        val resChannel = Channel<${resTypeKt}>()\n`
          : `        var res: ${resTypeKt}? = null\n`,
        "        coroutineScope {\n",
        "            launch {\n",
        reqStream
          ? "                for (item in req) reqChannel.send(item.toByteArray())\n"
          : "                reqChannel.send(req.toByteArray())\n",
        "                reqChannel.close()\n",
        "            }\n",
        (resStream
          ? [
            "launch {",
            "    wrpGuest.request(",
            `        ${getMethodString(rpcName)},`,
            "        reqChannel,",
            "        mapOf(),",
            "        {},",
            `        { payload -> resChannel.send(${resTypeKt}.parseFrom(payload)) },`,
            "        {}",
            "    )",
            "}",
          ]
          : [
            "wrpGuest.request(",
            `    ${getMethodString(rpcName)},`,
            "    reqChannel,",
            "    mapOf(),",
            "    {},",
            `    { payload -> res = ${resTypeKt}.parseFrom(payload) },`,
            "    {}",
            ")",
          ]).map((line) => `            ${line}\n`).join(""),
        "        }\n",
        `        return ${resStream ? "resChannel" : "res!!"}\n`,
        "    }\n",
      ].join("");
    }).join(""),
    "}\n",
  ].join("");
}

function genWrpServiceServeFunction(
  { schema, service, serviceName, getMethodString }: GenWrpServiceContext,
): string {
  return [
    `fun serveWrp${serviceName}(impl: ${serviceName}): WrpServer {\n`,
    "    val availableMethods: Set<String> = setOf(\n",
    Object.entries(service.rpcs).map(
      ([rpcName]) => `        ${getMethodString(rpcName)},\n`,
    ).join(""),
    "    )\n",
    "    return object : WrpServer(availableMethods) {\n",
    "        override fun handleRequest(request: WrpRequest) {\n",
    "            request.scope.launch {\n",
    "                request.sendHeader(mapOf())\n",
    "                try {\n",
    "                    when (request.methodName) {\n",
    Object.entries(service.rpcs).map(([rpcName, rpc]) => {
      const indent = "                        ";
      const { reqType, resType } = rpc;
      const reqTypeKt = rpcTypeToKt(schema, reqType);
      const camelRpcName = pascalToCamel(rpcName);
      if (!reqType.stream && !resType.stream) {
        return [
          `${getMethodString(rpcName)} -> {\n`,
          "    for (byteArray in request.req) {\n",
          `        val req = ${reqTypeKt}.parseFrom(byteArray)\n`,
          `        val res = impl.${camelRpcName}(req).toByteArray()\n`,
          "        request.sendPayload(res)\n",
          "        request.req.close()\n",
          "        break\n",
          "    }\n",
          "}\n",
        ].map((line) => `${indent}${line}`).join("");
      } else if (!reqType.stream && resType.stream) {
        return [
          `${getMethodString(rpcName)} -> {\n`,
          "    for (byteArray in request.req) {\n",
          `        val req = ${reqTypeKt}.parseFrom(byteArray)\n`,
          `        for (res in impl.${camelRpcName}(req)) {\n`,
          "            request.sendPayload(res.toByteArray())\n",
          "        }\n",
          "        request.req.close()\n",
          "        break\n",
          "    }\n",
          "}\n",
        ].map((line) => `${indent}${line}`).join("");
      } else if (reqType.stream && !resType.stream) {
        return [
          `${getMethodString(rpcName)} -> {\n`,
          `    val req = produce {\n`,
          `        for (byteArray in request.req) {\n`,
          `            val req = ${reqTypeKt}.parseFrom(byteArray)\n`,
          `            send(req)\n`,
          `        }\n`,
          `    }\n`,
          `    val res = impl.${camelRpcName}(req).toByteArray()\n`,
          "    request.sendPayload(res)\n",
          "    req.close()\n",
          "}\n",
        ].map((line) => `${indent}${line}`).join("");
      } else {
        return [
          `${getMethodString(rpcName)} -> {\n`,
          `    val req = produce {\n`,
          `        for (byteArray in request.req) {\n`,
          `            val req = ${reqTypeKt}.parseFrom(byteArray)\n`,
          `            send(req)\n`,
          `        }\n`,
          `    }\n`,
          `    for (res in impl.${camelRpcName}(req)) {\n`,
          "        request.sendPayload(res.toByteArray())\n",
          "    }\n",
          "    req.close()\n",
          "}\n",
        ].map((line) => `${indent}${line}`).join("");
      }
    }).join(""),
    "                    }\n",
    "                    request.sendTrailer(mapOf())\n",
    "                } catch (error: Exception) {\n",
    "                    val trailer = mutableMapOf<String, String>()\n",
    '                    trailer["wrp-status"] = "error"\n',
    '                    trailer["wrp-message"] = error.message ?: ""\n',
    "                    request.sendTrailer(trailer)\n",
    "                }\n",
    "            }\n",
    "        }\n",
    "    }\n",
    "}\n",
  ].join("");
}

function rpcTypeToKt(schema: Schema, rpcType: RpcType): string {
  const typePath = rpcType.typePath as `.${string}`;
  const { filePath } = schema.types[typePath];
  const javaPackage = getJavaPackage(schema, filePath);
  const javaOuterClassname = getJavaOuterClassname(schema, filePath);
  const typeName = typePath.split(".").pop()!;
  return `${javaPackage}.${javaOuterClassname}.${typeName}`;
}

function getJavaPackage(schema: Schema, filePath: string): string {
  const file = schema.files[filePath];
  return String(file.options["java_package"] || file.package || "");
}

// Check where there is any type defined (message, enum, service) in the proto file that has the given class name.
// https://github.com/protocolbuffers/protobuf/blob/a321b0/src/google/protobuf/compiler/java/name_resolver.cc#L195
function getJavaOuterClassname(schema: Schema, filePath: string): string {
  if (schema.files[filePath].options["java_outer_classname"]) {
    return String(schema.files[filePath].options["java_outer_classname"]);
  }
  const defaultJavaOuterClassname = getDefaultJavaOuterClassname(filePath);
  const conflict = Object.entries(schema.types).some(checkIfConflict) ||
    Object.entries(schema.services).some(checkIfConflict);
  if (conflict) {
    return defaultJavaOuterClassname + "OuterClass";
  }
  return defaultJavaOuterClassname;
  function checkIfConflict(
    [typePath, { filePath: typeFilePath }]: [
      typePath: string,
      value: { filePath: string },
    ],
  ): boolean {
    const type = typePath.split(".").pop()!;
    return typeFilePath === filePath &&
      defaultJavaOuterClassname.toUpperCase() === type.toUpperCase();
  }
}

function getDefaultJavaOuterClassname(filePath: string): string {
  return underscoresToCamelCase(basename(filePath, ".proto"), true);
}

// https://github.com/protocolbuffers/protobuf/blob/cc696d4/src/google/protobuf/compiler/java/helpers.cc#L173-L208
function underscoresToCamelCase(input: string, capNextLetter: boolean): string {
  const result: string[] = [];
  for (let i = 0; i < input.length; ++i) {
    if ("a" <= input[i] && input[i] <= "z") {
      if (capNextLetter) {
        result.push(input[i].toUpperCase());
      } else {
        result.push(input[i]);
      }
      capNextLetter = false;
    } else if ("A" <= input[i] && input[i] <= "Z") {
      if (i === 0 && !capNextLetter) {
        result.push(input[i].toLowerCase());
      } else {
        result.push(input[i]);
      }
      capNextLetter = false;
    } else if ("0" <= input[i] && input[i] <= "9") {
      result.push(input[i]);
      capNextLetter = true;
    } else {
      capNextLetter = true;
    }
  }
  if (input[input.length - 1] === "#") {
    result.push("_");
  }
  return result.join("");
}
