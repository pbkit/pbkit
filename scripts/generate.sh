rm -rf generated

deno run --unstable --allow-env --allow-read --allow-write cli/pb/entrypoint.ts \
  gen ts -o generated --runtime-dir ../core/runtime google/protobuf/descriptor.proto
