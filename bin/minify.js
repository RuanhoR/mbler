const {
  execSync
} = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  minify
} = require('terser');
fs.rmSync(path.join(__dirname, "../dist"), {
  recursive: true,
  force: true
})
try {
  execSync('tsc', {
    stdio: 'inherit'
  });
  console.log('TypeScript 编译完成！');
} catch (error) {
  console.error('TypeScript 编译失败:', error.message);
}
const distDir = path.resolve(__dirname, './../dist');
console.log(`🔍 扫描目录: ${distDir}`);
if (!fs.existsSync(distDir)) {
  console.error('dist 目录不存在:', distDir);
  process.exit(1);
}
const jsFiles = [];

function scanDirectory(directory) {
  const files = fs.readdirSync(directory);
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath); // 递归扫描子目录
    } else if ((file.endsWith('.js') && !file.endsWith('.min.js')) || file.endsWith(".json")) {
      jsFiles.push(fullPath);
    }
  });
}
scanDirectory(distDir);
if (jsFiles.length === 0) {
  console.log('没有找到需要压缩的 JS 文件');
  process.exit(0);
}
console.log(`${jsFiles.length} 个 JS 文件需要压缩`);
// 3. 使用 Terser 压缩每个 JS 文件
async function minifyJsFiles() {
  let successCount = 0;
  let failCount = 0;

  for (const filePath of jsFiles) {
    try {
      if (filePath.endsWith(".json")) {
        await fs.promises.cp(filePath.replace(path.join(__dirname, "../dist/lib"), path.join(__dirname, "../src")), filePath)
        continue;
      }
      // 读取原始 JS 文件
      const originalCode = fs.readFileSync(filePath, 'utf8');
      const result = await minify(originalCode, {
        compress: {
          drop_console: false,
          dead_code: true,
          drop_debugger: true
        },
        mangle: true,
        format: {
          comments: false // 移除注释
        }
      });
      if (result.error) {
        throw new Error(result.error);
      }
      const minifiedFilePath = filePath;
      fs.writeFileSync(minifiedFilePath, result.code, 'utf8');
      successCount++;
    } catch (error) {
      console.error(`压缩失败 ${filePath}:`, error.message);
      failCount++;
    }
  }

  console.log(`\n压缩完成: 成功 ${successCount} 个, 失败 ${failCount} 个`);
  if (failCount > 0) {
    process.exit(1);
  }
  await fs.promises.cp(path.join(__dirname, "../package.json"), path.join(__dirname, "../dist/package.json"))
  await fs.promises.cp(path.join(__dirname, "../bin"), path.join(__dirname, "../dist/bin"), {
    recursive: true,
    force: true
  })
  await fs.promises.cp(path.join(__dirname, "../test"), path.join(__dirname, "../dist/test"), {
    recursive: true,
    force: true
  })
}
minifyJsFiles().catch(err => {
  console.error('压缩过程中出现错误:', err);
  process.exit(1);
});