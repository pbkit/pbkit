import { basename } from "https://deno.land/std@0.147.0/path/mod.ts";
import { StringReader } from "https://deno.land/std@0.147.0/io/mod.ts";
import { RpcType, Schema } from "../../core/schema/model.ts";
import { CodeEntry } from "../index.ts";

export interface GenConfig {
  servicePaths: `.${string}`[];
}
export default async function* gen(
  schema: Schema,
  config: GenConfig,
): AsyncGenerator<CodeEntry> {
  for (const servicePath of config.servicePaths) {
    yield genWrpService(schema, servicePath);
  }
}

export function genWrpService(
  schema: Schema,
  servicePath: `.${string}`,
): CodeEntry {
  const service = schema.services[servicePath];
  const javaPackage = getJavaPackage(schema, service.filePath);
  const serviceName = servicePath.split(".").pop()!;
  function getMethodString(rpcName: string): string {
    return `"${servicePath.slice(1)}/${rpcName}"`;
  }
  return [
    `${javaPackage.replaceAll(".", "/")}/${serviceName}.kt`,
    new StringReader([
      `package ${javaPackage}\n`,
      "\n",
      "import dev.pbkit.wrp.core.WrpRequest\n",
      "import dev.pbkit.wrp.core.WrpServer\n",
      "import kotlinx.coroutines.channels.ReceiveChannel\n",
      "import kotlinx.coroutines.channels.produce\n",
      "import kotlinx.coroutines.launch\n",
      "\n",
      `interface ${serviceName} {\n`,
      Object.entries(service.rpcs).map(([rpcName, rpc]) => {
        const { reqType, resType } = rpc;
        const reqTypeKt = rpcTypeToKt(schema, reqType);
        const resTypeKt = rpcTypeToKt(schema, resType);
        if (!reqType.stream && !resType.stream) {
          return `    suspend fun ${rpcName}(req: ${reqTypeKt}): ${resTypeKt}\n`;
        } else if (!reqType.stream && resType.stream) {
          return `    suspend fun ${rpcName}(req: ${reqTypeKt}): ReceiveChannel<${resTypeKt}>\n`;
        } else if (reqType.stream && !resType.stream) {
          return `    suspend fun ${rpcName}(req: ReceiveChannel<${reqTypeKt}>): ${resTypeKt}\n`;
        } else {
          return `    suspend fun ${rpcName}(req: ReceiveChannel<${reqTypeKt}>): ReceiveChannel<${resTypeKt}>\n`;
        }
      }).join(""),
      "}\n",
      "\n",
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
        if (!reqType.stream && !resType.stream) {
          return [
            `${getMethodString(rpcName)} -> {\n`,
            "    for (byteArray in request.req) {\n",
            `        val req = ${reqTypeKt}.parseFrom(byteArray)\n`,
            `        val res = impl.${rpcName}(req).toByteArray()\n`,
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
            `        for (res in impl.${rpcName}(req)) {\n`,
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
            `    val res = impl.${rpcName}(req).toByteArray()\n`,
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
            `    for (res in impl.${rpcName}(req)) {\n`,
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
    ].join("")),
  ];
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

function getJavaOuterClassname(schema: Schema, filePath: string): string {
  return String(
    schema.files[filePath].options["java_outer_classname"] ||
      underscoresToCamelCase(basename(filePath, ".proto"), true),
  );
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
