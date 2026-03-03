import { env } from "node:process";
import type Build from ".";
import AdmZip from "adm-zip";
import path from "node:path";

function createFullZip(dir: string): AdmZip {
  const zip = new AdmZip();
  zip.addLocalFolder(dir);
  return zip
}
async function createZipWithMoreFolder(dir: [string, string][]): Promise<AdmZip> {
  const zip = new AdmZip();
  for (const folder of dir) {
    await zip.addLocalFolderPromise(folder[0], {
      zipPath: folder[1]
    })
  };
  return zip;
}
export async function generateRelease(build: Build) {
  if (!build.srcDirs) throw new Error("invaild Build")
  if (env.BUILD_MODULE !== "release") return;
  let zip: AdmZip;
  if (build.module == "all") {
    zip = await createZipWithMoreFolder([
      [build.srcDirs?.behavior, "behavior"],
      [build.srcDirs.resources, "resources"]
    ]);
  } else if (build.module == "behavior") {
    zip = createFullZip(build.srcDirs.behavior);
  } else {
    zip = createFullZip(build.srcDirs.resources)
  }
  await zip.writeZipPromise(build.outdirs?.dist as string)
}