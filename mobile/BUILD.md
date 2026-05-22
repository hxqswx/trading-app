# TradeAI Android APK 构建指南

## 前提：已安装 EAS CLI
```
npm install -g eas-cli
```

---

## 第一步：注册 / 登录 Expo 账号

去 https://expo.dev 注册免费账号，然后：

```bash
eas login
```

---

## 第二步：初始化 EAS 项目（只做一次）

```bash
cd mobile
eas init
```

> 这一步会自动创建项目 ID 并写入 app.json 的 `extra.eas.projectId`

---

## 第三步：填写后端地址

编辑 `eas.json`，把 `EXPO_PUBLIC_API_URL` 改成你的 Next.js 后端地址：

**选项 A — 本地测试（手机和电脑在同一个 WiFi）**
```json
"EXPO_PUBLIC_API_URL": "http://192.168.1.100:3000"
```
> 用 `ipconfig` 查你电脑的局域网 IP

**选项 B — 正式发布（部署到 Vercel）**
```bash
# 在 trading-app 根目录
npm install -g vercel
vercel --prod
```
然后把 Vercel 给的域名填进去：
```json
"EXPO_PUBLIC_API_URL": "https://trading-app-xxx.vercel.app"
```

---

## 第四步：构建 APK

```bash
# 供用户直接安装的 APK（可下载分发）
eas build --platform android --profile preview
```

等待 5-10 分钟，构建完成后 EAS 会给你一个 APK 下载链接。

---

## 第五步：让用户下载安装

构建成功后：
1. 在 https://expo.dev 的项目页面下载 APK
2. 把 APK 文件分享给用户（微信、网盘、自己的服务器均可）
3. 用户手机打开设置 → 允许安装未知来源应用 → 安装

---

## 其他命令

```bash
# 查看构建状态
eas build:list

# 生产版 AAB（用于上架 Google Play）
eas build --platform android --profile production
```
