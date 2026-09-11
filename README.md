# 小票录入系统 (Receipt Entry System)

基于 React 18 + TypeScript + Tailwind CSS + Capacitor 构建的智能小票识别录入与比价系统。支持手机浏览器直接使用，并已配置 Android 原生打包能力，可通过 GitHub Actions 自动编译生成 Android APK 安装包。

## 🌟 核心特性

- **纯前端本地 OCR 引擎**：内置 Tesseract.js（中英文双语字库），无需依赖第三方云端 AI，在手机端即可脱机运行。
- **智能纸张裁剪与图像增强**：自适应纸张边缘裁切、去噪与二值化处理，解决阴影、折痕及藤椅反光背景干扰。
- **生鲜超市小票两行式结构解析**：精准提取条码、品名、规格、单价、数量及金额。
- **价格记录与消费统计**：自动沉淀商品价格变动趋势，提供购买历史与对比分析。
- **Android APK 自动打包**：集成 Capacitor 原生容器与 GitHub Actions 工作流，代码推送后自动构建 APK。

## 📱 GitHub Actions 自动编译 APK

代码推送到 GitHub 仓库后：

1. **自动构建**：每次推送到 `main` 或 `master` 分支，GitHub Actions 均会自动执行 `.github/workflows/build-android.yml`。
2. **下载 APK**：
   - 进入 GitHub 仓库页面，点击顶部的 **Actions** 标签页。
   - 点击最近一次运行的 **Build Android APK** 工作流。
   - 滚动到底部的 **Artifacts (构件)** 区域，即可直接下载：
     - `receipt-entry-release-apk` (`app-release.apk` - 推荐下载安装)
     - `receipt-entry-debug-apk` (`app-debug.apk`)
3. **发布 Release 版本**：
   - 在 Actions 页面选择 **Build and Deploy APK**，点击 **Run workflow** 输入版本号（如 `v1.0.0`），构建完成后将自动在仓库 Releases 发布供所有人直接下载。

## 💻 本地开发与构建

### 1. Web 端开发
```bash
npm install
npm run dev
```
访问 `http://localhost:3000` 即可预览。

### 2. 同步与构建 Android 原生包
```bash
# 构建 Web 静态资源
npm run build

# 同步资源至 Android 工程
npx cap sync android

# 生成 Android APK
cd android
./gradlew assembleDebug
# 输出文件路径：android/app/build/outputs/apk/debug/app-debug.apk
```
