# trace-zone-backend 后端项目

本项目为“痕迹小屋”App 的后端服务，基于 Node.js + Express + MongoDB 实现，提供用户注册、空间管理、邀请请求等 API。

## 主要技术栈
- Node.js
- Express 框架
- MongoDB（Mongoose ODM）
- JWT 鉴权
- CORS 跨域

## 目录结构说明
- `server.js`：后端服务入口，注册路由和中间件
- `controllers/`：业务控制器，处理具体的 API 逻辑
- `middleware/`：中间件（如身份认证）
- `models/`：数据库模型（如用户、空间、请求）
- `routes/`：API 路由定义
- `utils/`：工具函数（如邀请码生成）

## 常用命令
- 安装依赖：`npm install`
- 启动开发：`npm run dev` 或 `node server.js`

## 说明
- 所有 API 路径均以 `/api/` 开头，前端通过 Axios 进行调用。
- 推荐使用 MongoDB Atlas 或本地 MongoDB 作为数据库。
- 需在根目录下配置 `.env` 文件，包含 `MONGO_URI` 等环境变量。

## 贡献与维护
如需协作开发，请遵循统一的代码风格，优先复用已有控制器和模型。

---

如有问题或建议，欢迎随时联系项目维护者。
