# 微信开发者工具问题排查

## 当前错误
`routeDone with a webviewId 5 is not found` - 这是开发者工具的缓存/状态问题

## 解决步骤

### 1. 清理开发者工具缓存
在微信开发者工具中：
- 点击菜单栏 **详情** → **本地设置**
- 点击 **清除缓存** → 选择全部清除
- 或者使用快捷键：`Cmd+Shift+P` (Mac) 然后输入 "清除缓存"

### 2. 重启开发者工具
- 完全关闭开发者工具
- 重新打开项目

### 3. 重新编译
- 点击 **编译** 按钮（或按 `Cmd+B`）
- 或者保存任意文件触发重新编译

### 4. 如果还不行，尝试：
- 删除项目的 `miniprogram_npm` 文件夹（如果有）
- 删除 `node_modules` 文件夹
- 重新 npm install

## 代码状态
代码本身没有问题，GitHub 已更新到最新版本。

## 拉取最新代码
```bash
cd ~/Desktop/bazi-miniapp
git pull origin main
```