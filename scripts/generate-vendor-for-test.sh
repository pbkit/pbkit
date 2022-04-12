### Use this script like below:
###
### ./scripts/generate-vendor-for-test.sh google/protobuf/descriptor.proto
### ./scripts/generate-vendor-for-test.sh --entry-path `pb vendor directory`

alias pb="deno run --unstable --allow-env --allow-read --allow-write cli/pb/entrypoint.ts"

PB_VENDOR_DIR=$(pb vendor directory)
OUT_DIR=tmp/generated-vendor
RUNTIME_DIR=../../core/runtime

if [ "$(ls -A $PB_VENDOR_DIR)" ]; then
  rm -rf $OUT_DIR
  pb gen ts -o $OUT_DIR --runtime-dir $RUNTIME_DIR --proto-path $PB_VENDOR_DIR "$@"
else
  echo "please run \`pb vendor install\` first"
fi
