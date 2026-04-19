# MCP 서버

> 클로드에게 외부 세계를 연결하는 표준 커넥터. 데이터베이스, 이메일, 깃허브, 우리 집까지 하나의 프로토콜로 묶는다.

## 개념

**Model Context Protocol**(MCP)은 LLM과 외부 도구가 대화하는 표준 프로토콜입니다. 원래 Anthropic이 제안했지만 현재는 OpenAI·Google 등도 지원하는 업계 표준으로 자리잡았습니다.

구조:

```
클로드 (클라이언트) ←→ MCP 서버 ←→ 실제 시스템 (DB, API, 파일시스템)
```

MCP 서버는 자신이 노출하는 **도구(tools)**, **리소스(resources)**, **프롬프트(prompts)**를 스키마로 선언합니다. 클로드는 이 스키마를 보고 "이 서버로 뭘 할 수 있는지" 이해합니다.

왜 표준이 중요한가:

- 도구마다 MCP 서버가 하나씩 있으면 클로드는 **새 연결 공부를 할 필요 없음**
- 같은 MCP 서버를 Claude Code, Claude Desktop, Cursor, Gemini CLI가 **그대로 공유**
- 서버 쪽 업데이트가 클라이언트에 자동 반영 (`--discovery` 계열)

## 전송 방식 세 가지

| 전송 | 용도 | 예 |
|------|------|-----|
| **stdio** | 로컬 프로세스와 표준 입출력 통신 | 파일시스템, 로컬 도구 |
| **SSE** (Server-Sent Events) | HTTP 기반 스트림 | 원격 서비스 |
| **HTTP** | 일반 HTTP 요청/응답 | 클라우드 API |

대부분의 MCP 서버가 stdio로 배포됩니다. 원격·SaaS 서비스는 HTTP/SSE 기반.

## 설치 방법

### CLI로 추가 (가장 간단)

```bash
# 로컬 npx 스타일
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem ~/docs

# 원격 HTTP
claude mcp add home-assistant --url https://my.homeassistant.example.com --token <TOKEN>

# 목록 확인
claude mcp list

# 제거
claude mcp remove filesystem
```

### 직접 설정 (수동)

사용자 전역 설정: `~/.claude.json` 또는 `~/.claude/settings.json`

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/docs"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### 프로젝트 단위 — `.mcp.json`

프로젝트 루트에 `.mcp.json`을 두면 팀 전체가 **같은 MCP 서버를 공유**합니다. git에 커밋하세요.

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/myapp"]
    }
  }
}
```

민감한 서버(개인 API 키 필요 등)는 `.claude/settings.local.json`에 두고 gitignore.

## 자주 쓰는 MCP 서버

### 파일·코드

- `@modelcontextprotocol/server-filesystem` — 지정 경로 파일 접근
- `@modelcontextprotocol/server-github` — 이슈·PR·리포지토리 조작
- `@modelcontextprotocol/server-gitlab` — GitLab 버전

### 데이터베이스

- `@modelcontextprotocol/server-postgres` — PostgreSQL SQL 질의
- `@modelcontextprotocol/server-sqlite` — SQLite
- `@supabase/mcp-server-supabase` — Supabase

### 커뮤니케이션

- `@modelcontextprotocol/server-slack` — 슬랙 읽기·쓰기
- `@anthropic-ai/mcp-server-gmail` — 지메일
- `@googleworkspace/cli` (gws mcp) — 구글 워크스페이스 전체

### 디자인·콘텐츠

- `@figma/mcp` — 피그마 공식
- `@notion/mcp-server` — 노션

### 웹·브라우저

- `@playwright/mcp` — Playwright 기반 브라우저 자동화
- `@browserbase/mcp` — 원격 브라우저

### 기타

- `notebooklm-mcp` — 구글 NotebookLM 연결
- `@home-assistant/mcp-server` — 홈어시스턴트
- `sequential-thinking` — 구조화된 사고 보조
- `memory` — 지식 그래프 메모리

대부분은 `npx` 한 줄로 설치됩니다.

## 실전 워크플로

### 프로젝트 초기 세팅

1. 팀이 공용으로 쓸 MCP를 `.mcp.json`에 정의 (DB, GitHub 등)
2. 개인 MCP는 `~/.claude/settings.json`에 (개인 슬랙, 개인 메일)
3. 민감 키는 환경변수로 전달

### 도구 이름 충돌

여러 MCP 서버가 같은 이름의 도구를 노출할 때는 프리픽스가 붙습니다(`<server>.<tool>`). 대화에서 명시적으로 "github MCP로 이슈 만들어 줘"처럼 서버명을 언급하면 정확해집니다.

### 디버깅

```bash
# 연결 상태
/mcp

# 도구 목록 자세히
claude mcp tools <server-name>

# 로그 보기
tail -f ~/.claude/logs/mcp-*.log
```

MCP 서버가 안 뜨면 대개 세 가지 원인:

1. `npx` 경로 문제 — Node.js 버전 확인
2. 환경변수 미설정 — API 키 `.env` 참조 여부
3. 도구 스키마 에러 — 서버 자체 버그. 릴리스 노트 확인

## 권한과 보안

MCP 도구도 일반 도구처럼 퍼미션 시스템 적용을 받습니다.

```json
{
  "permissions": {
    "allow": [
      "mcp__github__create_issue",
      "mcp__postgres__query"
    ],
    "deny": [
      "mcp__github__delete_repo",
      "mcp__postgres__execute"
    ]
  }
}
```

읽기 전용 도구는 allow로 풀어 두고, 쓰기/파괴 도구는 ask로 남겨 두는 것이 안전합니다.

### 민감 MCP는 로컬 설정에만

OAuth 토큰·개인 API 키가 필요한 MCP 서버 설정은 `.mcp.json`(팀 공유)이 아니라 `.claude/settings.local.json`(개인, gitignore)에 두세요. 실수로 커밋되면 키가 노출됩니다.

## 원격 MCP — 어디서나 연결

Claude Desktop과 Claude Code가 2025년 중반부터 **원격 MCP 서버**를 지원합니다. 원격 서버는 `--url` 기반으로 연결합니다.

```bash
claude mcp add my-api --url https://api.example.com/mcp --token $TOKEN
```

이 덕에 홈어시스턴트, 사내 서비스, SaaS(Linear, Notion) 같은 것들을 **설치 없이** 바로 쓸 수 있습니다. MCP 서버가 HTTP로 떠 있기만 하면 됩니다.

## MCP 서버 직접 만들기 — 개요

우리 팀 내부 도구를 클로드에게 노출하고 싶다면 MCP 서버를 직접 만들 수 있습니다. 공식 SDK가 TypeScript와 Python으로 나와 있습니다.

간단한 뼈대(TypeScript):

```typescript
import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";

const server = new Server({ name: "my-tool", version: "1.0.0" });

server.setRequestHandler("tools/list", async () => ({
  tools: [{
    name: "get_metrics",
    description: "내부 대시보드에서 주간 KPI 가져오기",
    inputSchema: { type: "object", properties: { week: { type: "string" } } },
  }],
}));

server.setRequestHandler("tools/call", async (req) => {
  if (req.params.name === "get_metrics") {
    const data = await fetch(`https://internal-dashboard/api?week=${req.params.arguments.week}`).then(r => r.json());
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }
});

await server.connect(new StdioServerTransport());
```

이걸 npm 패키지로 배포하면 팀원 누구나 `claude mcp add my-tool -- npx -y @myorg/mcp-server`로 붙입니다. 사내 스킬을 표준화하기에 가장 깔끔한 방법입니다.

## 함정들

### 도구 과잉 노출

MCP 서버 하나가 30~50개 도구를 노출하는 경우가 많습니다. 다 켜 놓으면 **프롬프트가 거대해지고 비용이 폭발**합니다. 실제 쓰는 것만 `allowed-tools`로 제한하세요.

### 버전 드리프트

MCP 서버는 자주 업데이트되는데 클라이언트 쪽 스키마 캐시가 오래되면 호출이 실패할 수 있습니다. `/mcp` 재연결 또는 세션 재시작.

### 보안 경계

MCP 서버는 **클로드가 보내는 명령을 거의 그대로 실행**합니다. 서버 측에서 입력 검증·권한 체크를 해 두지 않으면 LLM 의도 조작(prompt injection)으로 위험한 동작이 가능합니다. 특히 사내 서버를 쓸 때 서버 쪽 sanity check가 필수.

### 느린 서버

원격 MCP 서버 중에 응답이 수 초씩 걸리는 게 있습니다. 클로드가 타임아웃을 잡고 재시도하면서 토큰이 쌓입니다. 사내 MCP는 200ms 이하를 목표로.

## 요약

MCP는 **LLM 시대의 USB-C**에 가깝습니다. 같은 포트로 다양한 도구를 꽂고 빼며, 도구가 새로 나와도 프로토콜은 그대로입니다. 클로드 코드를 잘 쓰는 팀은 예외 없이 `.mcp.json`이 채워져 있습니다.

시작은 한 줄로 충분합니다.

```bash
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem ~/docs
```

---

*MCP 표준은 [modelcontextprotocol.io](https://modelcontextprotocol.io/)에서, 클로드 코드 연동은 [공식 MCP 문서](https://code.claude.com/docs/en/mcp)에서 확인할 수 있습니다.*
