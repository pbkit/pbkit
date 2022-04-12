alias pb="deno run --unstable --allow-env --allow-read --allow-write cli/pb/entrypoint.ts"

OUT_DIR=generated
RUNTIME_DIR=../core/runtime
PROTO_FILE=google/protobuf/descriptor.proto

if [ "$(ls -A $PB_VENDOR_DIR)" ]; then
  rm -rf $OUT_DIR
  pb gen ts -o $OUT_DIR --runtime-dir $RUNTIME_DIR $PROTO_FILE
else
  echo "please run \`pb vendor install\` first"
fi
