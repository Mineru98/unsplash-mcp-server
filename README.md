# unsplash-mcp-server

### 모델 컨텍스트 프로토콜(MCP) 서버 개발 가이드: LLM을 위한 강력한 도구 구축

[![modelcontextprotocol.io](https://img.shields.io/badge/modelcontextprotocol.io-orange.svg)](https://modelcontextprotocol.io/)
[![MCP SDK - TypeScript](https://img.shields.io/badge/MCP%20SDK-TypeScript%201.6.1-blue.svg)](https://github.com/modelcontextprotocol/typescript-sdk)
[![MCP SDK - Python](https://img.shields.io/badge/MCP%20SDK-Python%201.3.0-blue.svg)](https://github.com/modelcontextprotocol/python-sdk)
[![MCP SDK - Kotlin](https://img.shields.io/badge/MCP%20SDK-Kotlin%200.3.0-blue.svg)](https://github.com/modelcontextprotocol/kotlin-sdk)
[![Last Updated](https://img.shields.io/badge/Last%20Updated-March%202025-brightgreen.svg)]()

## 목차

1. [MCP 서버 소개](#1-mcp-서버-소개)
2. [핵심 서버 아키텍처](#2-핵심-서버-아키텍처)
3. [첫 번째 MCP 서버 구축하기](#3-첫-번째-mcp-서버-구축하기)
4. [기능 노출하기](#4-기능-노출하기)
   * [도구 정의 및 구현](#도구-정의-및-구현)
   * [리소스 관리](#리소스-관리)
   * [프롬프트 생성 및 공유](#프롬프트-생성-및-공유)
5. [고급 서버 기능](#5-고급-서버-기능)
   * [샘플링](#샘플링)
   * [루트](#루트)
   * [스트리밍 응답](#스트리밍-응답)
   * [진행 상황 보고](#진행-상황-보고)
   * [리소스 구독](#리소스-구독)
   * [다중 서버 협업](#다중-서버-협업)
   * [성능 최적화](#성능-최적화)
6. [보안 및 모범 사례](#6-보안-및-모범-사례)
7. [문제 해결 및 리소스](#7-문제-해결-및-리소스)
8. [예시 구현](#8-예시-구현)

## 1. MCP 서버 소개

**모델 컨텍스트 프로토콜(MCP)이란?**

모델 컨텍스트 프로토콜(MCP)은 대형 언어 모델(LLM) 애플리케이션(클라이언트)과 외부 서비스(서버) 간의 상호작용을 촉진하는 표준화된 통신 프로토콜입니다. 이러한 서버는 맥락 정보, 도구 및 리소스를 제공합니다. MCP는 관심사의 분리를 명확하게 하여 LLM 애플리케이션이 데이터 검색, 외부 API 액세스 및 특수 계산과 같은 작업을 전담하는 서버에 위임할 수 있도록 합니다.

**MCP 생태계에서 서버의 역할**

서버는 MCP 생태계의 중추로, LLM 애플리케이션과 외부 세계 간의 중개자 역할을 합니다. 서버는 다음과 같은 다양한 기능을 제공할 수 있습니다:

* **실시간 데이터 제공:** 데이터베이스, API 또는 다른 출처에서 정보를 가져옵니다.
* **특수 도구 노출:** 이미지 처리, 코드 실행, 데이터 분석과 같은 기능을 제공합니다.
* **프롬프트 관리 및 공유:** 미리 정의된 프롬프트 또는 프롬프트 템플릿을 저장하고 제공합니다.
* **외부 시스템과의 연결:** 다른 애플리케이션, 서비스 또는 플랫폼과 통합합니다.

**MCP 서버 구현의 이점**

MCP 서버를 구현하는 것에는 여러 가지 이점이 있습니다:

* **확장성:** LLM 애플리케이션의 핵심 코드를 수정하지 않고도 새로운 기능을 쉽게 추가할 수 있습니다.
* **모듈화:** 특수 기능을 독립적이고 재사용 가능한 구성 요소로 개발하고 유지 관리할 수 있습니다.
* **상호 운용성:** 다른 LLM 애플리케이션들이 동일한 맥락 소스와 도구를 공유할 수 있게 합니다.
* **확장성:** 워크로드를 분산하고 복잡한 작업을 효율적으로 처리할 수 있습니다.
* **혁신:** LLM의 힘을 활용하여 독특한 기능과 통합을 개발하는 데 집중할 수 있습니다.

**서버와 클라이언트: 관계 이해하기**

MCP 아키텍처에서:

* **클라이언트**는 일반적으로 LLM 애플리케이션(Claude Desktop, VS Code 또는 맞춤 애플리케이션)으로, 서버에 연결하고 서비스를 요청하는 역할을 합니다.
* **서버**는 클라이언트의 요청을 처리하고 응답을 제공하는 독립적인 프로세스로, 도구, 리소스 및 프롬프트와 같은 기능을 노출합니다.

하나의 클라이언트는 여러 서버에 연결할 수 있고, 하나의 서버는 여러 클라이언트를 지원할 수 있습니다. 이 다대다 관계는 유연하고 강력한 통합을 가능하게 합니다.

## 2. 핵심 서버 아키텍처

### MCP 서버의 핵심 구성 요소

MCP 서버는 여러 핵심 구성 요소들이 함께 작동하는 시스템입니다:

1. **프로토콜 계층:** 이 계층은 메시지 프레이밍, 요청/응답 연결, 알림 처리 등 고수준의 통신 패턴을 처리합니다. `Protocol`, `Client`, `Server`와 같은 클래스들이 포함됩니다.
2. **전송 계층:** 이 계층은 클라이언트와 서버 간의 실제 통신을 관리합니다. MCP는 Stdio와 HTTP(Server-Sent Events(SSE))와 같은 여러 전송 메커니즘을 지원합니다. 모든 전송은 메시지 교환을 위해 JSON-RPC 2.0을 사용합니다.
3. **기능(Capabilities):** 서버가 할 수 있는 일들을 정의합니다. 기능은 도구(실행 가능한 함수), 리소스(데이터 소스) 및 프롬프트(LLM을 위한 미리 정의된 텍스트 입력)가 포함됩니다.

### 프로토콜의 기본 원칙

MCP는 클라이언트-서버 아키텍처를 기반으로 구축되었습니다. LLM 애플리케이션(호스트)은 연결을 시작합니다. 클라이언트는 호스트 애플리케이션 내에서 서버와 1:1 연결을 유지합니다. 서버는 클라이언트에게 맥락, 도구 및 프롬프트를 제공합니다.

### 서버 생애 주기: 연결, 교환, 종료

MCP 연결의 생애 주기는 세 가지 주요 단계로 구성됩니다:

1. **초기화:**
   * 클라이언트는 `initialize` 요청을 보내며, 프로토콜 버전과 기능을 포함합니다.
   * 서버는 자신의 프로토콜 버전과 기능을 응답으로 보냅니다.
   * 클라이언트는 `initialized` 알림을 보내 이를 확인합니다.
   * 이후 정상적인 메시지 교환이 시작됩니다.

2. **메시지 교환:** 초기화 후, 클라이언트와 서버는 다음과 같은 패턴을 사용하여 메시지를 교환합니다:
   * **요청-응답:** 한쪽에서 요청을 보내면 다른 쪽이 응답을 보냅니다.
   * **알림:** 한쪽에서 메시지를 보냅니다(응답은 없습니다).

3. **종료:** 연결은 여러 방법으로 종료될 수 있습니다:
   * `close()` 메서드를 통한 정상 종료.
   * 전송 연결 종료.
   * 오류 발생 시 종료.

### 메시지 형식과 전송

MCP는 메시지 형식으로 JSON-RPC 2.0을 사용합니다. 주요 메시지 유형은 세 가지입니다:

1. **요청(Requests):** 응답을 기대하는 메시지로, `method`와 선택적 `params`를 포함합니다.

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "method_name",
  "params": { "key": "value" }
}
```

2. **응답(Responses):** 요청에 대한 응답으로, `result`(성공 시) 또는 `error`(실패 시)를 포함합니다.

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": { "key": "value" }
}
```

3. **알림(Notifications):** 응답을 기대하지 않는 1방향 메시지입니다. `method`와 선택적 `params`를 포함합니다.

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": { "key": "value" }
}
```

#### 전송 방식

MCP는 여러 전송 메커니즘을 지원합니다. 기본적으로 두 가지 전송이 제공됩니다:

1. **표준 입력/출력 (stdio):** 이 전송은 표준 입력과 출력을 사용하며, 로컬 통합 및 명령줄 도구에 적합합니다.

*서버 예시:*

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: "example-server",
  version: "1.0.0"
}, { capabilities: {} });

const transport = new StdioServerTransport();
await server.connect(transport);
```

*클라이언트 예시:*

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client({
  name: "example-client",
  version: "1.0.0"
}, { capabilities: {} });

const transport = new StdioClientTransport({
  command: "./server", // 서버 실행 파일 경로
  args: ["--option", "value"] // 선택적 인수
});
await client.connect(transport);
```

2. **서버-전송 이벤트(SSE):** 이 전송은 HTTP POST 요청을 클라이언트-서버 통신에 사용하고, 서버-클라이언트 스트리밍을 위해 Server-Sent Events를 사용합니다.

*서버 예시:*

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Response } from 'express';

const server = new McpServer({
  name: "example-server",
  version: "1.0.0"
}, { capabilities: {} });

const app = express();
app.use(express.json());

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res as Response);
  await server.connect(transport);
  app.locals.transport = transport;
});

app.post("/messages", async (req, res) => {
  const transport = app.locals.transport;
  await transport.handlePostMessage(req, res);
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

*클라이언트 예시:*

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const client = new Client({
  name: "example-client",
  version: "1.0.0"
}, { capabilities: {} });

const transport = new SSEClientTransport(
  new URL("http://localhost:3000/sse")
);
await client.connect(transport);
```

#### 커스텀 전송

MCP는 커스텀 전송 구현을 지원합니다. 커스텀 전송은 `Transport` 인터페이스를 구현해야 합니다.

```typescript
interface Transport {
  start(): Promise<void>;
  send(message: JSONRPCMessage): Promise<void>;
  close(): Promise<void>;
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;
}
```

#### 오류 처리

전송 구현은 연결 오류, 메시지 파싱 오류, 프로토콜 오류, 네트워크 시간 초과 및 리소스 정리를 처리해야 합니다. 예시:

```typescript
class ExampleTransport implements Transport {
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  async start() {
    try {
      // 연결 로직
    } catch (error) {
      this.onerror?.(new Error(`Failed to connect: ${error}`));
      throw error;
    }
  }

  async send(message: JSONRPCMessage) {
    try {
      // 전송 로직
    } catch (error) {
      this.onerror?.(new Error(`Failed to send message: ${error}`));
      throw error;
    }
  }
  
  async close(): Promise<void> {
    // 종료 로직
  }
}
```

## 3. 첫 번째 MCP 서버 구축하기

이 섹션은 TypeScript SDK를 사용하여 기본 MCP 서버를 만드는 과정을 안내합니다.

### 개발 환경 설정

1. **Node.js와 npm 설치:** Node.js(버전 18 이상)와 npm(Node Package Manager)을 시스템에 설치하십시오.
2. **프로젝트 디렉토리 생성:**

```bash
mkdir my-mcp-server
cd my-mcp-server
```

3. **Node.js 프로젝트 초기화:**

```bash
npm init -y
```

4. **MCP TypeScript SDK 설치:**

```bash
npm install @modelcontextprotocol/sdk
```

5. **TypeScript 및 기타 의존성 설치:**

```bash
npm install typescript zod
```

6. **`tsconfig.json` 파일 생성:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./build"
  },
  "include": ["src/**/*"]
}
```

7. **`src` 디렉토리 및 `index.ts` 파일 생성:**

```bash
mkdir src
touch src/index.ts
```

### SDK 선택

`@modelcontextprotocol/sdk`는 TypeScript로 MCP 서버를 구축하는 데 편리한 방법을 제공합니다. 프로토콜 세부 사항을 처리하므로 서버의 기능 구현에 집중할 수 있습니다.

### 서버 인터페이스 구현

간단한 입력을 반환하는 서버를 만들겠습니다. `src/index.ts` 파일에 다음 내용을 작성합니다:

```typescript
#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// MCP 서버 인스턴스 생성
const server = new McpServer({
  name: 'EchoServer',
  version: '1.0.0',
});

// 입력을 그대로 되돌려주는 도구 추가
server.tool(
  'echo',
  { message: z.string() }, // 입력 스키마 정의
  async ({ message }) => ({
    content: [{ type: 'text', text: `Echo: ${message}` }],
  })
);

// 전송 방식 생성 (이번 예시에서는 stdio 사용)
const transport = new StdioServerTransport();

// 서버와 전송 연결
await server.connect(transport);
```

### 연결 및 인증 처리

이 간단한 예에서는 `StdioServerTransport`를 사용하여 연결을 자동으로 처리합니다. 더 복잡한 시나리오에서는 다른 전송 메커니즘을 사용할 때 커스텀 연결 처리 및 인증을 구현해야 할 수 있습니다.

### 클라이언트 요청 처리

`server.tool()` 메서드는 서버가 처리할 "echo"라는 도구를 정의합니다. 두 번째 인수는 `{ message: z.string() }`로 `zod` 라이브러리를 사용하여 도구의 예상 입력 스키마를 정의합니다. 세 번째 인수는 비동기 함수로 입력을 받아 결과를 반환합니다. `McpServer`는 자동으로 클라이언트의 요청을 적절한 도구로 라우팅합니다.

이 서버를 실행하려면:

1. **TypeScript 코드 컴파일:**

```bash
npx tsc
```

2. **컴파일된 JavaScript 실행:**

```bash
node build/index.js
```

`package.json`의 `scripts` 섹션에 다음을 추가하십시오:

```json
"scripts": {
  "build": "tsc && node -e \"require('fs').chmodSync('build/index.js', '755')\"",
  "start": "node build/index.js"
}
```

이제 `npm run build`와 `npm start`를 실행할 수 있습니다. `./build/index.js`를 실행하고 JSON-RPC 2.0 메시지를 입력하여 테스트할 수 있습니다.

`echo` 도구로 유효한 JSON-RPC 2.0 메시지 예시:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": { "name": "echo", "arguments": { "message": "Hello, world!" } }
}
```
