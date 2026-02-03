import {
  spawn
} from 'child_process';
import {
  input
} from './../utils/index.js'
import char from './../lang/index.js'
/**
 * 拉取 Git 仓库
 * @param {string} repoDir - 本地 Git 仓库目录（如 './my-project'）
 * @returns {Promise<void>}
 */
export default function gitPull(repoDir: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const gitPullProcess = spawn('git', ['pull'], {
      cwd: repoDir,
      stdio: 'inherit'
    });

    gitPullProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`Git 拉取成功: ${repoDir}`);
        resolve(true);
        return;
      }

      // 如果失败，检查是否是 "dubious ownership" 错误
      let errorOutput = '';
      const gitPullProcessWithError = spawn('git', ['pull'], {
        cwd: repoDir,
        stdio: ['ignore', 'pipe', 'pipe'] // 捕获 stderr
      });

      gitPullProcessWithError.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      gitPullProcessWithError.on('close', async (code) => {
        if (code !== 0 && errorOutput.includes('dubious ownership')) {
          const tip = char.noGit;
          const answer = await input(tip)
          if (answer === '1') {
            // 选项 1：仅当前目录可信
            await runGitConfig(`--global --add safe.directory "${repoDir}"`);
            retryGitPull();
          } else if (answer === '2') {
            // 选项 2：全局信任所有目录（不推荐）
            await runGitConfig('--global --replace-all safe.directory "*"');
            retryGitPull();
          } else if (answer === '3') {
            reject(new Error('用户取消 Git 拉取'));
          } else {
            reject(new Error('无效的用户输入'));
          }
        } else {
          // 其他错误（非安全限制）
          reject(new Error(`❌ Git 拉取失败，退出码: ${code}\n错误信息: ${errorOutput}`));
        }
      });
    });
    async function retryGitPull() {
      const retryProcess = spawn('git', ['pull'], {
        cwd: repoDir,
        stdio: 'inherit'
      });
      retryProcess.on('close', (retryCode) => {
        if (retryCode === 0) {
          resolve(true);
        } else {
          reject(new Error(`❌ Git 拉取重试失败，退出码: ${retryCode}`));
        }
      });
      retryProcess.on('error', (err) => {
        reject(new Error(`❌ 重试执行错误: ${err.message}`));
      });
    }
  });
}
function runGitConfig(configArgs: string) {
  return new Promise((configResolve, configReject) => {
    const configProcess = spawn('git', ['config', ...configArgs.split(' ')], {
      stdio: 'inherit'
    });
    configProcess.on('close', (code) => {
      if (code === 0) {
        configResolve(true);
      } else {
        console.warn(`执行 git config 失败（可能不影响后续操作），退出码: ${code}`);
        configResolve(true); // 即使失败也继续尝试 git pull
      }
    });
    configProcess.on('error', (err) => {
      configResolve(true); // 即使出错也继续尝试 git pull
    });
  });
}