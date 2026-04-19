import { tmpdir } from "node:os";
import * as path from "node:path";

const config = {
  tmpdir: path.join(tmpdir(), ".mbler"),
  mcxVersion: "0.0.2-beta.r7",
  mcxCoreVersion: "0.0.6"
};
export default config;
