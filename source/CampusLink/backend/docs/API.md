# CampusLink Phase 1 API

## 通用约定

Base URL：`http://localhost:8000/api`

所有响应采用统一结构：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

受保护接口使用请求头：

```text
Authorization: Bearer <token>
```

错误使用真实 HTTP 状态码，同时响应体中的 `code` 与之保持一致。常用错误码：`400` 请求不合法、`401` 未登录、`403` 无权限、`404` 资源不存在、`409` 状态冲突、`422` 参数校验失败。

## 用户与鉴权

### POST /auth/register

```json
{
  "username": "Tom",
  "email": "123@qq.com",
  "password": "123456"
}
```

### POST /auth/login

用户名字段也可以填写邮箱。

```json
{
  "username": "Tom",
  "password": "123456"
}
```

返回 `data.token`、`data.token_type` 和 `data.user`。

### GET /users/me

获取当前用户信息，需要登录。

### PUT /users/me

可更新 `username`、`email`、`avatar`、`contact`、`bio`，需要登录。

### GET /users/me/products

获取当前用户发布的商品，需要登录。

## 商品

### GET /products

查询参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| keyword | string | 标题或描述模糊搜索 |
| category | string | 分类精确筛选 |
| status | enum | AVAILABLE、RESERVED、SOLD、OFFLINE |
| page | int | 页码，默认 1 |
| page_size | int | 每页数量，默认 20，最大 100 |

返回结构适配前端 `Product` 类型，包括嵌套 `seller` 和展示字段 `time_ago`。

### GET /products/{id}

获取商品详情。

### POST /products

需要登录。

```json
{
  "title": "数学教材",
  "description": "九成新",
  "price": 20,
  "category": "教材",
  "image_url": "/assets/images/goods_math_book.png",
  "location": "图书馆"
}
```

### PUT /products/{id}

修改自己的商品，需要登录。请求字段均可选。

### PATCH /products/{id}/status

修改自己的商品状态，需要登录。

```json
{
  "status": "RESERVED"
}
```

### DELETE /products/{id}

删除自己的商品，需要登录。

### GET /products/{id}/contact

登录后查看卖家的邮箱和联系方式。

## 收藏

- `GET /favorites`：我的收藏列表
- `GET /products/{id}/favorite`：当前用户是否已收藏
- `POST /products/{id}/favorite`：收藏商品
- `DELETE /products/{id}/favorite`：取消收藏

以上接口均需要登录。

## 交易请求

### POST /products/{id}/transactions

买家发起交易请求，需要登录。

```json
{
  "note": "今晚可以在图书馆面交吗？"
}
```

### GET /transactions

查看与当前用户相关的买入和卖出交易请求。

### PATCH /transactions/{id}

```json
{
  "status": "ACCEPTED"
}
```

状态流转规则：

- 卖家可以将 `PENDING` 改为 `ACCEPTED` 或 `REJECTED`。
- 买卖双方可以取消允许取消的交易。
- 卖家可以将 `ACCEPTED` 改为 `COMPLETED`。
- 接受交易后商品自动变为 `RESERVED`，完成后自动变为 `SOLD`。
- 同一商品只能接受一个买家的请求；重复接受其他请求返回 `409`。
- 取消尚未接受的请求不会影响其他买家的预约。已有已接受交易时，不能通过商品接口直接改成在售或已售，须完成或取消该交易。

## 图片上传（2026-10-28 新增）

- `POST /uploads`：登录后以 `multipart/form-data` 的 `file` 字段提交图片。
- 支持 JPEG、PNG、WebP，单张最大 5 MB、解码后最大 2000 万像素。服务端将图片缩放到最长边 2048 像素并重新编码为 WebP。
- 成功返回 `201` 和 `data.image_url`（如 `/api/uploads/<随机文件名>.webp`），用于发布商品的 `image_url` 字段。
- `GET /uploads/{filename}`：读取已保存的封面；不存在或非法文件名返回 `404`。
- 路径由 `CAMPUSLINK_UPLOAD_DIR` 控制，默认 `./data/uploads`。部署时需持久化该目录，不能只保留数据库。
- 当前前端每件商品保存一张封面；尚未提供多图相册或孤立上传清理。

## 校园论坛（2026-10-29 拓展）

以下路径仍以 `/api` 为前缀。读取公开，写入与本人列表需要 Bearer token；统一响应包装不变。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/forum/posts` | 列表，`keyword` 搜标题或正文、`category`、`page`、`page_size` |
| GET | `/forum/posts/mine` | 当前用户的帖子，支持分页 |
| POST | `/forum/posts` | 发帖，成功 201 |
| GET | `/forum/posts/{id}` | 帖子详情 |
| PUT | `/forum/posts/{id}` | 本人编辑，完整替换可编辑字段 |
| DELETE | `/forum/posts/{id}` | 本人删除，评论级联删除 |
| GET | `/forum/posts/{id}/comments` | 评论按创建时间及 ID 升序分页 |
| POST | `/forum/posts/{id}/comments` | 发表评论，成功 201 |
| PUT | `/forum/comments/{id}` | 修改本人评论 |
| DELETE | `/forum/comments/{id}` | 删除本人评论 |

帖子写入字段：`title`（去空白后 1–120 字符）、`content`（1–10000 字符）、`category`（备考 / 新生 / 宿舍 / 学习 / 生活）、`image_url`（可选，默认空字符串，仅平台本地图片路径）。不接受 `author_id` 等额外字段。封面上传沿用 `/uploads`，不支持远程追踪图片地址。

评论写入字段仅 `content`（去空白后 1–1000 字符）。越权修改/删除返回 403；帖子或评论不存在返回 404；参数错误返回 422。帖子作者也不能编辑、删除其他用户的单条评论。

分页 `data` 为 `{ items, total, page, page_size }`，默认每页 20，最大 100。帖子按创建时间及 ID 倒序。标题或正文按字面子串搜索，`%`、`_` 不视为通配符。

帖子响应包含 `id/title/content/summary/category/tag/tagType/image_url/author/comment_count/created_at/updated_at/created_date`。`author` 仅公开 `id/name/avatar`；不暴露邮箱、密码哈希。评论响应为 `id/post_id/content/author/created_at/updated_at`。前端以文本显示正文和评论。

旧库需显式增加缺失表：在配套前端根目录执行 `npm run upgrade:postgres`，先备份再建表。旧的四表备份仍可恢复验证，恢复后再升级即可启用论坛。

## 健康检查

`GET /health` 检查 API 和数据库连接状态。


## 消息与点赞接口 2026年10月30日

以下路径以 `/api` 为前缀。点赞读取允许游客访问；携带有效会话时返回本人状态。写入、消息读取和已读操作均要求登录。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/products/{id}/like` | 商品点赞总数与本人状态 |
| PUT | `/products/{id}/like` | 设置为点赞，重复调用不重复计数 |
| DELETE | `/products/{id}/like` | 取消点赞，重复调用仍成功 |
| GET / PUT / DELETE | `/forum/posts/{id}/like` | 同上，针对帖子 |
| GET | `/notifications/unread-count` | 仅当前用户未读数 |
| GET | `/notifications` | 当前用户消息，支持 unread_only、page、page_size |
| PATCH | `/notifications/{id}/read` | 当前用户单条消息已读，幂等 |
| PATCH | `/notifications/read-all` | 请求体 up_to_id，只标记本人不晚于该 ID 的消息 |

点赞响应 data 为 `{count, liked}`。消息列表 data 为 `{items, total, page, page_size, unread_count}`；item 含 id、kind、message、is_read、created_at、link。相关内容删除后 link 为 null。访问他人的消息 ID 返回 404。通知只能由服务端业务流程生成，不能由客户端指定收件人或手动创建。

新评论提醒帖子作者；预订、交易状态及点赞的提醒规则见配套 `docs/MESSAGES_AND_LIKES.md`。同一用户对同一内容反复取消再点赞不刷通知，自己操作不通知自己。消息和点赞数据持久保存；旧事件不补发。数据库更新只新增三张表。
