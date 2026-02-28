import { tmpdir } from "node:os";
import * as path from "node:path";

const config = {
  tmpdir: path.join(tmpdir(), ".mbler"),
};
export default config;
