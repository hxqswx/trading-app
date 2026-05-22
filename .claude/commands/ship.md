# /ship — 一键部署后端 + 打包安卓 APK

执行以下完整流程，每步完成后报告状态，遇到错误立即停止并说明原因。

## 环境变量检查

读取 `trading-app/.env.local`，提取 `DATABASE_URL`、`AUTH_SECRET`、`APCA_API_KEY_ID` 等关键变量是否存在。
读取 `mobile/eas.json`，确认 `EXPO_PUBLIC_API_URL` 不是占位符 `your-backend.vercel.app`。
如果 API URL 还是占位符，先执行第一步部署，再回来更新它。

---

## 第一步：部署 Next.js 后端到 Vercel

工作目录切换到项目根目录（`trading-app/`，即包含 `vercel.json` 的目录）。

运行：
```
vercel --prod
```

- 如果询问 "Link to existing project"，选择已有项目（`trading-app`）
- 等待部署完成，从输出中提取生产域名（格式如 `https://xxx.vercel.app`）
- 把这个域名记录下来，后续步骤会用到

部署成功后，用 curl 或 fetch 验证后端存活：
```
curl https://<domain>/api/quote?symbols=AAPL
```
收到 JSON 响应则表示后端正常。

---

## 第二步：更新 APK 的后端地址

打开 `mobile/eas.json`，将 `preview` 和 `production` 两个 profile 下的
`EXPO_PUBLIC_API_URL` 全部替换为第一步得到的 Vercel 域名。

保存文件。

---

## 第三步：构建安卓 APK

工作目录切换到 `mobile/`。

确认 EAS 登录状态：
```
eas whoami
```
如果未登录，提示用户运行 `eas login` 后重试。

运行构建：
```
eas build --platform android --profile preview --non-interactive
```

- 实时显示构建进度
- 构建完成后提取 APK 下载链接
- 打印最终摘要

---

## 完成后输出摘要

用表格展示结果：

| 步骤 | 状态 | 详情 |
|------|------|------|
| 后端部署 | ✅ / ❌ | Vercel 域名或错误信息 |
| eas.json 更新 | ✅ / ❌ | 新的 API URL |
| APK 构建 | ✅ / ❌ | 下载链接或构建 ID |

如果 APK 构建是异步的（EAS 返回构建 ID 而非立即完成），告知用户用以下命令查看进度：
```
eas build:list
```
以及在 https://expo.dev 项目页面查看下载链接。
