const { join } = require("path");

const runtimeZipPath = join(__dirname, "../../runtime.zip");
const vendorZipPath = join(__dirname, "../../vendor.zip");

exports.runtimeZipPath = runtimeZipPath;
exports.vendorZipPath = vendorZipPath;
