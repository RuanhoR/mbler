const path = require('path');
const Zip = require('adm-zip')
/**
 * 压缩目录为 ZIP，解压后根目录是 sourceDir 内的内容，而不是 sourceDir 文件夹本身
 * @param {Array} sourceDir 要压缩的目录路径，如 ['C:/data/myfolder' 或 '/home/user/myfolder']
 * @param {string} outputFile 输出的 ZIP 文件完整路径，如 'C:/backup/output.zip' 或 '/backup/output.zip'
 * @returns {Promise<boolean>} 是否压缩成功
 */
async function compressDirectoryToZip(sourceDir, outputFile) {
  const zip = new Zip();
  for (let item of sourceDir) {
    if (typeof item !==  "string") continue;
    zip.addLocalFolder(item);
  }
  await zip.writeZipPromise(outputFile);
}
module.exports = compressDirectoryToZip;