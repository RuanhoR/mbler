import { extname } from "node:path";
import mcx from "../..";
import McxLoader from "./mcx";
import { Utils } from "./utils";
const LoaderMap = {
  mcx: McxLoader
}
function isExsitLoader(name: string): name is keyof typeof LoaderMap {
  return Object.keys(LoaderMap).includes(name);
}
export async function loader(_dir: string) {
  const dir = Utils.CheckPath(_dir);
  const loader = new LoaderMap.mcx(dir, Utils);
  const ext = extname(dir).slice(1);
  if (isExsitLoader(ext)) 
}