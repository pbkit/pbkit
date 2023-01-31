if [ $# -eq 0 ]; then
  targets=(
    x86_64-unknown-linux-gnu
    x86_64-pc-windows-msvc
    x86_64-apple-darwin
    aarch64-apple-darwin
  )
else
  targets=($@)
fi

function main {
  rm -rf tmp/dist
  for target in ${targets[@]}; do
    build $target
  done
}

function build {
  target=$1
  clis=(
    pb
    pollapo
  )
  outdir=tmp/dist/pbkit-$target
  mkdir -p tmp/dist
  for cli in ${clis[@]}; do
    deno bundle ./cli/$cli/entrypoint.ts ./tmp/dist/$cli.bundle.js
    deno compile -A --unstable --target $target -o $outdir/$cli ./tmp/dist/$cli.bundle.js
  done
  pushd $outdir
    tar -cf ../pbkit-$target.tar .
  popd
}

main
