import {
  spawn
} from 'child_process';

/**
 * 克隆 Git 仓库
 * @param {string} repoUrl - Git 仓库地址
 * @param {string} targetDir - 本地目标目录（如 './my-project'）
 * @returns {Promise<void>}
 */
export default function gitClone(repoUrl: string, targetDir: string) {
  return new Promise((resolve, reject) => {
    const gitProcess = spawn('git', ['clone', repoUrl, targetDir], {
      stdio: 'inherit',
    });
    gitProcess.on('close', (code: number) => {
      if (code === 0) {
        resolve(`Git 克隆成功: ${repoUrl} → ${targetDir}`);
      } else {
        reject(new Error(` Git 克隆失败，退出码: ${code}`));
      }
    });
    gitProcess.on('error', (err: Error) => {
      reject(new Error(`${err.message}`));
    });
  });
}