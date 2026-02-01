const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// 清理 dist 目录
fs.rmSync(path.join(__dirname, "../dist"), {
  recursive: true,
  force: true
});

// 编译 TypeScript
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
const jsonFiles = [];

// 扫描编译后的 JS 文件
function scanDistDirectory(directory) {
  const files = fs.readdirSync(directory);
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDistDirectory(fullPath); // 递归扫描子目录
    } else if (file.endsWith('.js') && !file.endsWith('.min.js')) {
      jsFiles.push(fullPath);
    }
  });
}

// 扫描源码中的 JSON 文件
function scanSrcJsonDirectory(directory) {
  const files = fs.readdirSync(directory);
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanSrcJsonDirectory(fullPath); // 递归扫描子目录
    } else if (file.endsWith(".json")) {
      // 计算对应的 dist 路径
      const relativePath = path.relative(path.join(__dirname, "../src"), fullPath);
      const distPath = path.join(distDir, "lib", relativePath);
      jsonFiles.push({
        srcPath: fullPath,
        distPath: distPath
      });
    }
  });
}

scanDistDirectory(distDir);
scanSrcJsonDirectory(path.join(__dirname, "../src"));

if (jsFiles.length === 0) {
  console.log('没有找到需要压缩的文件');
  process.exit(0);
}

console.log(`${jsFiles.length} 个文件需要处理`);

async function processFiles() {
  let successCount = 0;
  let failCount = 0;

  // 首先处理 JSON 文件复制
  for (const jsonFile of jsonFiles) {
    try {
      console.log(`复制 JSON: ${jsonFile.srcPath} -> ${jsonFile.distPath}`);
      
try{      // 确保目标目录存在
      await fs.promises.mkdir(path.dirname(jsonFile.distPath), { recursive: true });}catch{}
      await fs.promises.copyFile(jsonFile.srcPath, jsonFile.distPath);
      successCount++;
    } catch (error) {
      console.error(`处理失败 ${jsonFile.srcPath}:`, error.message);
      failCount++;
    }
  }

  // 然后处理 JS 文件压缩
  for (const filePath of jsFiles) {
    try {
      // 处理 JS 文件压缩
      const originalCode = fs.readFileSync(filePath, 'utf8');
      const result = await minify(originalCode, {
        compress: {
          drop_console: false,
          dead_code: true,
          drop_debugger: true
        },
        mangle: true,
        format: {
          comments: false
        }
      });

      if (result.error) {
        throw new Error(result.error);
      }

      fs.writeFileSync(filePath, result.code, 'utf8');
      successCount++;
    } catch (error) {
      console.error(`处理失败 ${filePath}:`, error.message);
      failCount++;
    }
  }

  console.log(`\n处理完成: 成功 ${successCount} 个, 失败 ${failCount} 个`);
  // 复制其他必要文件
  await Promise.all([
    async function(){
      const fileC = JSON.parse(await fs.promises.readFile(path.join(__dirname, "../package.json"), "utf-8"))
      delete fileC.devDependencies
      await fs.promises.writeFile(path.join(distDir, "package.json"), JSON.stringify(fileC))
    }(),
    fs.promises.cp(
      path.join(__dirname, "../bin"),
      path.join(__dirname, "../dist/bin"),
      { recursive: true, force: true }
    ),
    fs.promises.cp(
      path.join(__dirname, "../test"),
      path.join(__dirname, "../dist/test"),
      { recursive: true, force: true }
    ),
    fs.promises.cp(
      path.join(__dirname, "../README.md"),
      path.join(__dirname, "../dist/README.md")
    ),
    fs.promises.cp(
      path.join(__dirname, "../LICENSE"),
      path.join(__dirname, "../dist/LICENSE")
    )
  ]);
}

processFiles().catch(err => {
  console.error('处理过程中出现错误:', err);
  process.exit(1);
});