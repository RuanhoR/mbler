const $ = (e) => document.querySelector(e);
const $$ = (e) => document.querySelectorAll(e);
const MainApp = $("#app");
const create = (tag) => document.createElement(tag);
const tree = create("div");
tree.classList.add("folder");
tree.id = "fileListTree";
const fileFolder = create("div");
fileFolder.className = "file-list";
tree.appendChild(fileFolder);
const scrollBar = create("div");
scrollBar.classList.add("scrollBar");
tree.appendChild(scrollBar);
const edit = create("div");
edit.classList.add("edit");
edit.id = "EditProot";
const textarea = create("textarea");
textarea.className = "edits editInput";
textarea.placeholder = "未打开文件";
const highFolder = create("div");
highFolder.className = "edits editInput highlight";
textarea.setAttribute("spellcheck", false);
textarea.addEventListener("input", () => {
  try {
    const value = textarea.value;
    const result = hljs?.highlightAuto(value);
    highFolder.innerHTML = result?.value.replace(/\n/g, "<br>") || value;
  } catch (err) {
    highFolder.textContent = value;
  }
});
textarea.addEventListener('scroll', function syncScroll() {
  highFolder.scrollTop = textarea.scrollTop;
  highFolder.scrollLeft = textarea.scrollLeft;
});
const saveBtn = create('button')
saveBtn.innerText = "保存"
edit.appendChild(saveBtn)
edit.appendChild(textarea);
edit.appendChild(highFolder);
// 挂载到页面
MainApp.appendChild(tree);
MainApp.appendChild(edit);

const app = $('#app');
const folder = $('#fileListTree');
const editArea = $('.edit');
const editor = $('.editInput');
const highlightEl = $('.edit .highlight');

// 可选：代码高亮库
let hljs;
try {
  hljs = window.hljs;
} catch (e) {
  console.warn("highlight.js 未加载，代码高亮将降级显示");
}

// APP 核心类
class App {
  constructor() {
    this.initResize();
  }

  // 拖拽调整左右面板宽度
  initResize() {
    let isDragging = false;
    const setWidths = (percent) => {
      const clamped = Math.max(20, Math.min(80, percent));
      app.style.setProperty('--width', `${clamped}%`);
      folder.style.width = `${clamped}%`;
      editArea.style.left = `${clamped}%`;
      editArea.style.width = `${100 - clamped}%`;
    };
    setWidths(20);
    const handleStart = (e) => {
      isDragging = true;
      scrollBar.style.width = "8px";
      e.preventDefault();
    };
    const handleMove = (e) => {
      if (!isDragging) return;
      let clientX;
      if (e.type === 'mousemove') {
        clientX = e.clientX;
      } else if (e.type === 'touchmove') {
        clientX = e.touches[0]?.clientX;
      } else return;
      const appRect = app.getBoundingClientRect();
      const newPercent = (clientX - appRect.left) / appRect.width * 100;
      setWidths(newPercent);
    };
    const handleEnd = () => {
      if (isDragging) {
        isDragging = false;
        scrollBar.style.width = "5px";
      }
    };
    scrollBar.addEventListener('mousedown', handleStart);
    scrollBar.addEventListener('touchstart', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('touchcancel', handleEnd);

    // 初始加载
    this.loadFileList("./", 0);
  }

  // 加载文件树
  async loadFileList(dir, level) {
    try {
      const res = await fetch("/api/list?name=" + encodeURIComponent(dir));
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      this.RangerFileList(fileFolder, data.data, dir, level);
    } catch (err) {
      fileFolder.innerHTML = `<div class="error">加载文件失败: ${err.message}</div>`;
      console.error(err);
    }
  }

  // 渲染文件和文件夹
  RangerFileList(container, list, currentPath, level) {
    container.innerHTML = '';
    if (!Array.isArray(list)) return;

    const sortedList = list.sort((a, b) => {
      if (a.isdir && !b.isdir) return -1;
      if (!a.isdir && b.isdir) return 1;
      return a.name.localeCompare(b.name);
    });

    for (let item of sortedList) {
      if (typeof item.name !== "string" || typeof item.isdir !== "boolean") continue;

      const fileGroup = create("div");
      fileGroup.className = "fileGroup";
      fileGroup.dataset.filename = item.name;
      fileGroup.dataset.isdir = item.isdir;
      fileGroup.dataset.path = currentPath === "./" ? item.name : `${currentPath}/${item.name}`;
      fileGroup.dataset.level = level;
      fileGroup.dataset.loaded = "false";
      fileGroup.dataset.expanded = "false";
      fileGroup.style.marginLeft = `${level * 20}px`;

      const icon = create("span");
      icon.className = "fileIcon";
      icon.textContent = item.isdir ? "📁" : "📄";

      const expandIndicator = create("span");
      expandIndicator.className = "expandIndicator";
      expandIndicator.textContent = item.isdir ? "▶" : "";

      const file = create("div");
      file.className = "fileName";
      file.textContent = item.name;

      if (item.isdir) {
        fileGroup.addEventListener('click', async (e) => {
          e.stopPropagation();
          const isExpanded = fileGroup.dataset.expanded === "true";
          const indicator = fileGroup.querySelector('.expandIndicator');

          if (isExpanded) {
            this.collapseFolder(fileGroup);
            indicator.textContent = "▶";
            fileGroup.dataset.expanded = "false";
          } else {
            this.expandFolder(fileGroup, item.name, level);
            indicator.textContent = "▼";
            fileGroup.dataset.expanded = "true";
          }
        });
        if (item.isdir) {
          fileGroup.append(expandIndicator, icon, file);
        } else {
          fileGroup.append(icon, file);
        }
      } else {
        fileGroup.addEventListener('click', async (e) => {
          e.stopPropagation();
          const path = fileGroup.dataset.path;
          try {
            const res = await fetch(`/api/get?name=${encodeURIComponent(path)}`);
            if (!res.ok) throw new Error(`读取失败: ${res.status}`);
            const content = await res.json();
            textarea.value = content.data;
            highlightEl.textContent = "";
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
          } catch (err) {
            alert(`文件读取失败: ${err.message}`);
            console.error(err);
          }
        });
        fileGroup.append(icon, file);
      }

      container.appendChild(fileGroup);
    }
  }

  // 展开文件夹：加载子内容
  async expandFolder(folderGroup, dirName, level) {
    try {
      const res = await fetch("/api/list?name=" + encodeURIComponent(dirName));
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data.data)) {
        const noDataGroup = create("div");
        noDataGroup.className = "fileGroup";
        noDataGroup.style.marginLeft = `${(level + 1) * 20}px`;
        noDataGroup.style.color = "#999";
        noDataGroup.textContent = "暂无内容";
        folderGroup.after(noDataGroup);
        return;
      }

      for (let item of data.data) {
        if (typeof item.name !== "string" || typeof item.isdir !== "boolean") continue;

        const fileGroup = create("div");
        fileGroup.className = "fileGroup";
        fileGroup.dataset.filename = item.name;
        fileGroup.dataset.isdir = item.isdir;
        fileGroup.dataset.path = `${dirName}/${item.name}`;
        fileGroup.dataset.level = level + 1;
        fileGroup.dataset.loaded = "true";
        fileGroup.dataset.expanded = "false";
        fileGroup.style.marginLeft = `${(level + 1) * 20}px`;

        const icon = create("span");
        icon.className = "fileIcon";
        icon.textContent = item.isdir ? "📁" : "📄";

        const expandIndicator = create("span");
        expandIndicator.className = "expandIndicator";
        expandIndicator.textContent = item.isdir ? "▶" : "";

        const file = create("div");
        file.className = "fileName";
        file.textContent = item.name;

        if (item.isdir) {
          fileGroup.addEventListener('click', async (e) => {
            e.stopPropagation();
            const isExpanded = fileGroup.dataset.expanded === "true";
            const indicator = fileGroup.querySelector('.expandIndicator');
            if (isExpanded) {
              this.collapseFolder(fileGroup);
              indicator.textContent = "▶";
              fileGroup.dataset.expanded = "false";
            } else {
              this.expandFolder(fileGroup, item.name, level + 1);
              indicator.textContent = "▼";
              fileGroup.dataset.expanded = "true";
            }
          });
          fileGroup.append(expandIndicator, icon, file);
        } else {
          fileGroup.addEventListener('click', async (e) => {
            e.stopPropagation();
            const path = fileGroup.dataset.path;
            try {
              const res = await fetch(`/api/get?name=${encodeURIComponent(path)}`);
              if (!res.ok) throw new Error(`读取失败: ${res.status}`);
              const content = await res.json();
              textarea.value = content.data;
              highlightEl.textContent = "";
              textarea.dispatchEvent(new Event("input", { bubbles: true }));
            } catch (err) {
              alert(`文件读取失败: ${err.message}`);
              console.error(err);
            }
          });
          fileGroup.append(icon, file);
        }

        folderGroup.after(fileGroup);
      }
    } catch (err) {
      const errorGroup = create("div");
      errorGroup.className = "fileGroup";
      errorGroup.style.marginLeft = `${(level + 1) * 20}px`;
      errorGroup.style.color = "red";
      errorGroup.textContent = `加载失败: ${err.message}`;
      folderGroup.after(errorGroup);
    }
  }
  collapseFolder(folderGroup) {
    const parentMargin = parseInt(folderGroup.style.marginLeft || "0", 10);
    const parentLevel = parentMargin / 20;
    let next = folderGroup.nextSibling;

    while (next) {
      const nextMargin = parseInt(next.style.marginLeft || "0", 10);
      const nextLevel = nextMargin / 20;

      if (nextLevel > parentLevel) {
        next.remove(); // 移除子级
        next = folderGroup.nextSibling;
      } else {
        break; // 遇到同级或上级，停止移除
      }
    }
  }
}

// 启动应用
try {
  new App();
} catch (err) {
  alert("应用启动失败: " + err.message);
}
