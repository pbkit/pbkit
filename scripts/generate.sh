alias pb="deno run --unstable --allow-env --allow-read --allow-write cli/pb/entrypoint.ts"

TMP_DIR=generated_tmp
OUT_DIR=generated
RUNTIME_DIR=../core/runtime
PROTO_FILES=(
  google/protobuf/descriptor.proto
  google/protobuf/compiler/plugin.proto
)

if [ "$(ls -A $PB_VENDOR_DIR)" ]; then
  pb gen ts -o $TMP_DIR --runtime-dir $RUNTIME_DIR ${PROTO_FILES[@]}
  rm -rf $OUT_DIR
  cp -r $TMP_DIR $OUT_DIR
  rm -rf $TMP_DIR
else
  echo "please run \`pb vendor install\` first"
fi
