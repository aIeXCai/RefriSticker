# RefriSticker Image API

把用户的旅行照片,通过三种艺术风格(插画 / 国风 / 漫画)转绘为可下载的冰箱贴底图。

- **基础 URL**: `https://api.refristicker.com/v1`(待部署后填入实际域名)
- **协议**: HTTPS / JSON
- **鉴权**: HTTP Header `Authorization: Bearer <API_KEY>`
- **OpenAPI 规范**: 文末附 OpenAPI 3.1 YAML,可导入 Swagger / Stoplight / Postman

---

## 目录

- [快速开始](#快速开始)
- [鉴权](#鉴权)
- [接口](#接口)
  - [POST /v1/generate](#post-v1generate)
- [请求参数](#请求参数)
- [响应](#响应)
- [错误码](#错误码)
- [限流](#限流)
- [定价](#定价)
- [示例代码](#示例代码)
- [服务等级](#服务等级)
- [OpenAPI 规范](#openapi-规范)

---

## 快速开始

```bash
curl -X POST https://api.refristicker.com/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "京都街景,工笔国风,五重塔,樱花,宣纸肌理",
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "style": "chinese",
    "size": "1728x2304"
  }'
```

成功响应会返回一张 Base64 编码的 JPEG 底图。整个调用 5-15 秒。

---

## 鉴权

每个 API Key 形如 `rs_live_xxxxxxxxxxxxxxxx`,通过 HTTP Header 传递:

```text
Authorization: Bearer rs_live_xxxxxxxxxxxxxxxx
```

### 申请 Key
- 邮件至 `api@refristicker.com`,或
- 在 <https://refristicker.com/dashboard> 注册自助申请

### Key 类型

| 类型 | 前缀 | 用途 |
|---|---|---|
| **Live** | `rs_live_` | 生产环境,真实计费 |
| **Test** | `rs_test_` | 测试环境,不真实计费,响应更快 |

> ⚠️ **不要在前端代码中暴露 API Key**。请在你的服务端中转调用,客户端只调你自己的服务。

---

## 接口

### POST /v1/generate

把一张用户照片,按指定风格生成冰箱贴底图。

#### 端点

```text
POST https://api.refristicker.com/v1/generate
Content-Type: application/json
Authorization: Bearer <API_KEY>
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `prompt` | string | ✅ | 文字描述。已拼装好 base / style / composition 的完整 prompt,直接传。≤ 1500 字符 |
| `image` | string | ✅ | 用户照片,**Base64 编码的 data URL**(如 `data:image/jpeg;base64,...`)。≤ 4 MB(超出请先压缩) |
| `style` | enum | ✅ | `illustration` / `chinese` / `comic` |
| `size` | enum | ✅ | `1728x2304` (4:5) / `2048x2048` (1:1) / `2304x1728` (4:3) |
| `reference_image` | string | ❌ | 可选,自定义风格参考图(Base64 data URL)。不传则使用内置风格参考 |

#### 响应

成功(`200 OK`):

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "width": 1728,
  "height": 2304,
  "request_id": "req_abc123",
  "usage": {
    "input_tokens": 0,
    "output_tokens": 0,
    "image_count": 1
  }
}
```

| 字段 | 说明 |
|---|---|
| `image` | 生成的底图,JPEG 格式的 Base64 data URL |
| `width` / `height` | 实际尺寸(像素) |
| `request_id` | 本次调用的唯一 ID,用于问题排查 |
| `usage.image_count` | 计入计费的图片张数(默认 1) |

---

## 错误码

| HTTP | 业务码 | 含义 | 处理建议 |
|---|---|---|---|
| `400` | `invalid_prompt` | prompt 缺失或超长 | 检查 `prompt` 字段,≤ 1500 字符 |
| `400` | `invalid_image` | 图片格式错误或过大 | 必须是 jpeg/png/webp/heic,≤ 4MB |
| `400` | `invalid_style` | style 字段不在白名单 | 用 `illustration` / `chinese` / `comic` |
| `400` | `invalid_size` | size 字段不在白名单 | 用白名单里的三种尺寸 |
| `401` | `unauthorized` | API Key 缺失或无效 | 检查 Header `Authorization: Bearer <key>` |
| `403` | `key_disabled` | Key 已被禁用 | 联系 `api@refristicker.com` |
| `403` | `model_not_entitled` | 账号无权访问该模型 | 升级套餐 |
| `429` | `rate_limited` | 触发限流 | 降低 QPS,实现退避重试 |
| `500` | `internal_error` | 服务异常 | 重试,或附 request_id 联系我们 |
| `502` | `upstream_error` | 上游 AI 模型失败 | 重试,持续失败请联系 |
| `504` | `upstream_timeout` | 上游超时(默认 240s) | 重试,或换低分辨率 size |

错误响应统一格式:

```json
{
  "error": {
    "code": "rate_limited",
    "message": "请求过于频繁,请稍后重试",
    "request_id": "req_abc123"
  }
}
```

---

## 限流

| 套餐 | QPS(每秒) | 并发数 | 月配额 |
|---|---|---|---|
| Free | 1 | 2 | 100 张 |
| Starter | 5 | 10 | 5,000 张 |
| Pro | 20 | 50 | 50,000 张 |
| Enterprise | 自定义 | 自定义 | 自定义 |

超出 QPS 触发 `429 rate_limited`。超出月配额返回 `403 quota_exceeded`。

---

## 定价

| 尺寸 | 单价 |
|---|---|
| 2048×2048 (1:1) | **¥0.50** / 张 |
| 2304×1728 (4:3) | **¥0.60** / 张 |
| 1728×2304 (4:5) | **¥0.70** / 张 |

- 月结,用量统计基于 `usage.image_count`
- 大客户可签年度合同享 8 折
- 测试 Key 不计费

---

## 示例代码

### cURL

```bash
curl -X POST https://api.refristicker.com/v1/generate \
  -H "Authorization: Bearer $REFRISTICKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "京都街景,工笔国风,五重塔,樱花,宣纸肌理",
    "image": "data:image/jpeg;base64,'"$PHOTO_BASE64"'",
    "style": "chinese",
    "size": "1728x2304"
  }'
```

### JavaScript (Node.js)

```js
import fs from "node:fs";

const photo = fs.readFileSync("user-photo.jpg").toString("base64");

const response = await fetch("https://api.refristicker.com/v1/generate", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.REFRISTICKER_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "京都街景,工笔国风,五重塔,樱花,宣纸肌理",
    image: `data:image/jpeg;base64,${photo}`,
    style: "chinese",
    size: "1728x2304",
  }),
});

const result = await response.json();
if (!response.ok) throw new Error(result.error.message);

const buffer = Buffer.from(result.image.split(",")[1], "base64");
fs.writeFileSync("output.jpg", buffer);
```

### Python

```python
import base64
import os
import requests

with open("user-photo.jpg", "rb") as f:
    photo = base64.b64encode(f.read()).decode()

response = requests.post(
    "https://api.refristicker.com/v1/generate",
    headers={"Authorization": f"Bearer {os.environ['REFRISTICKER_API_KEY']}"},
    json={
        "prompt": "京都街景,工笔国风,五重塔,樱花,宣纸肌理",
        "image": f"data:image/jpeg;base64,{photo}",
        "style": "chinese",
        "size": "1728x2304",
    },
    timeout=300,
)
response.raise_for_status()
result = response.json()

with open("output.jpg", "wb") as f:
    f.write(base64.b64decode(result["image"].split(",")[1]))
```

### Java

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.nio.file.Files;
import java.nio.file.Path;

public class Example {
  public static void main(String[] args) throws Exception {
    String photo = Base64.getEncoder().encodeToString(Files.readAllBytes(Path.of("user-photo.jpg")));

    String body = String.format("""
        {
          "prompt": "京都街景,工笔国风,五重塔,樱花,宣纸肌理",
          "image": "data:image/jpeg;base64,%s",
          "style": "chinese",
          "size": "1728x2304"
        }
        """, photo);

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("https://api.refristicker.com/v1/generate"))
        .header("Authorization", "Bearer " + System.getenv("REFRISTICKER_API_KEY"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();

    HttpResponse<String> response = HttpClient.newHttpClient()
        .send(request, HttpResponse.BodyHandlers.ofString());

    System.out.println(response.body());
  }
}
```

---

## 服务等级

| 指标 | 目标 |
|---|---|
| 可用性 | 99.5%(非企业级) |
| P50 延迟 | 8-12s |
| P95 延迟 | 30-45s |
| P99 延迟 | 60-90s(受 Seedream 上游影响) |
| 失败重试 | 建议指数退避,最多 3 次 |

---

## OpenAPI 规范

下方是可导入 Swagger / Stoplight / Postman 的 OpenAPI 3.1 完整规范。

```yaml
openapi: 3.1.0
info:
  title: RefriSticker Image API
  version: 1.0.0
  description: |
    把用户的旅行照片,通过三种艺术风格(插画 / 国风 / 漫画)
    转绘为可下载的冰箱贴底图。
  contact:
    email: api@refristicker.com
  license:
    name: Proprietary

servers:
  - url: https://api.refristicker.com/v1
    description: Production

security:
  - bearerAuth: []

paths:
  /generate:
    post:
      operationId: generate
      summary: 生成风格化冰箱贴底图
      description: |
        接收用户照片与风格参数,返回 2K 分辨率的冰箱贴底图。
        调用时长 5-15 秒,失败可重试。
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GenerateRequest'
            examples:
              chinese:
                summary: 国风工笔
                value:
                  prompt: 京都街景,工笔国风,五重塔,樱花,宣纸肌理
                  image: data:image/jpeg;base64,/9j/4AAQ...
                  style: chinese
                  size: 1728x2304
              illustration:
                summary: 复古插画
                value:
                  prompt: 京都街景,清新复古插画,五重塔,樱花,丝网印刷
                  image: data:image/jpeg;base64,/9j/4AAQ...
                  style: illustration
                  size: 2048x2048
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GenerateResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '429':
          $ref: '#/components/responses/RateLimited'
        '500':
          $ref: '#/components/responses/InternalError'
        '502':
          $ref: '#/components/responses/UpstreamError'
        '504':
          $ref: '#/components/responses/UpstreamTimeout'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: Custom

  schemas:
    GenerateRequest:
      type: object
      required: [prompt, image, style, size]
      properties:
        prompt:
          type: string
          minLength: 1
          maxLength: 1500
          description: 已拼装好的完整 prompt(由调用方或客户端的 prompt-builder 拼装)
        image:
          type: string
          pattern: '^data:image\/(jpeg|png|webp|heic|heif);base64,'
          description: 用户照片的 Base64 data URL,≤ 4MB
        style:
          type: string
          enum: [illustration, chinese, comic]
          description: 艺术风格
        size:
          type: string
          enum: ['1728x2304', '2048x2048', '2304x1728']
          description: 输出尺寸(对应 4:5 / 1:1 / 4:3)
        reference_image:
          type: string
          pattern: '^data:image\/(jpeg|png|webp|heic|heif);base64,'
          description: 可选,自定义风格参考图

    GenerateResponse:
      type: object
      required: [image, width, height, request_id]
      properties:
        image:
          type: string
          description: 生成图片的 Base64 data URL
        width:
          type: integer
          description: 实际宽度(像素)
        height:
          type: integer
          description: 实际高度(像素)
        request_id:
          type: string
          description: 本次调用的唯一 ID
        usage:
          type: object
          properties:
            image_count:
              type: integer
              description: 计入计费的图片张数

    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code:
              type: string
              description: 业务错误码
            message:
              type: string
              description: 中文错误提示
            request_id:
              type: string
              description: 本次调用的唯一 ID

  responses:
    BadRequest:
      description: 请求参数错误
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Unauthorized:
      description: API Key 缺失或无效
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Forbidden:
      description: Key 被禁用 / 无权访问 / 配额用尽
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    RateLimited:
      description: 触发限流
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    InternalError:
      description: 服务异常
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    UpstreamError:
      description: 上游 AI 模型失败
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    UpstreamTimeout:
      description: 上游超时
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

---

## 更新日志

- **2026-06-23** v1.0.0 — 初版上线,3 种风格 × 3 种尺寸,基于 Doubao Seedream 5.0 lite
