# 플러그인·스킬·Agent SDK

> 클로드 코드 밖으로 확장하는 세 갈래. 작게는 팀에 배포할 **플러그인**부터, 크게는 우리 서비스 안에 심는 **Agent SDK**까지.

## 세 개념의 구분

| 이름 | 누가 쓰나 | 무엇을 하나 |
|------|-----------|-------------|
| **스킬(Skill)** | 개인·팀 | 한 가지 작업을 SKILL.md + 스크립트로 정의 |
| **플러그인(Plugin)** | 팀·커뮤니티 | 여러 스킬·에이전트·훅을 한 묶음으로 배포 |
| **Agent SDK** | 제품·서비스 제작자 | 클로드 코드가 아닌 **내 앱 안**에 에이전트 심기 |

이 글은 각각의 언제·어떻게를 간단히 정리합니다.

## 스킬

가장 작은 단위. 개별 `SKILL.md` 파일 하나에 지침과 선택적 스크립트.

```
~/.claude/skills/weekly-digest/
├── SKILL.md
└── scripts/
    └── scan.py
```

상세는 별도 문서 "슬래시 커맨드"와 "스크립트로 에이전트 스킬 고도화하기" 편 참고.

### 활용 포인트

- 개인 반복 작업 추출
- 팀 공용 규칙·절차 공유 (git 커밋)
- 스크립트로 결정론적 부분을 분리해 토큰 절약

## 플러그인

여러 스킬·서브에이전트·훅·MCP 설정을 **한 폴더**로 묶어 배포합니다.

### 플러그인 구조

```
my-plugin/
├── plugin.json              # 메타데이터
├── skills/
│   ├── deploy/SKILL.md
│   └── rollback/SKILL.md
├── agents/
│   └── reviewer.md
├── hooks/
│   └── precommit.json       # 프로젝트 settings 머지에 사용
└── mcp/
    └── config.json          # 공용 MCP 서버 정의
```

`plugin.json` 최소 예:

```json
{
  "name": "acme-tooling",
  "version": "1.0.0",
  "description": "Acme 사내 개발 도구 번들",
  "author": "Acme Eng Team"
}
```

### 설치 방법

로컬 폴더에서:

```bash
claude plugin install ./my-plugin
```

깃허브 저장소에서:

```bash
claude plugin install github:acme/acme-tooling
```

레지스트리에서:

```bash
claude plugin install acme-tooling
```

### 활용 포인트

- **온보딩 자동화** — 신입 개발자가 `plugin install` 한 줄로 팀 표준 세팅
- **버전 관리** — SemVer로 업그레이드 제어
- **배포 채널** — 사내 레지스트리, GitHub, 또는 공용 마켓플레이스
- **분리된 맥락** — 프로젝트별로 필요한 플러그인만 켬

### 마켓플레이스

Anthropic이 공식 **플러그인 마켓플레이스**를 운영합니다. 인기 플러그인 예:

- `claude-code-plus` — 확장 슬래시 커맨드 모음
- `react-tooling` — React 프로젝트 특화
- `rails-companion` — Rails 관련 스킬
- `security-kit` — OWASP 체크리스트, 비밀 스캔

커뮤니티 기여 플러그인도 많으니 [공식 마켓플레이스](https://code.claude.com/plugins)에서 검색.

### 배포하기

내가 만든 플러그인을 공유:

1. 깃허브 저장소 공개
2. `plugin.json`의 `name`, `version` 정확히
3. README에 설치 명령·스크린샷·예시
4. (선택) Anthropic 마켓플레이스에 등록 신청

보안 감사가 공식 등록의 허들인 편이라, 초기에는 깃허브 공유로 충분합니다.

### 활용 시나리오

**팀 프로젝트 온보딩 플러그인**

```
team-frontend-plugin/
├── skills/
│   ├── new-component/SKILL.md     # 컴포넌트 생성 스캐폴드
│   ├── ko-review/SKILL.md         # 한국어 리뷰
│   └── deploy-staging/SKILL.md    # 스테이징 배포
├── agents/
│   └── design-reviewer.md         # 디자인 일관성 검토
└── hooks/
    └── format.json                # 저장 시 자동 포맷
```

신입 개발자: `claude plugin install github:company/team-frontend-plugin` 한 줄로 팀 표준 탑재.

## Agent SDK — 클로드 코드 밖에서

**Claude Agent SDK**는 클로드 코드의 핵심 구성(도구 호출, 메모리, 훅, 퍼미션, MCP)을 **내 애플리케이션에 심을 수 있게** 노출한 라이브러리입니다.

TypeScript와 Python 버전 모두 공식 지원.

### 언제 쓸까

- 슬랙 봇: "`@claude` 멘션하면 DB 조회"
- 웹앱: 사내 지식베이스에 대화형 질의 인터페이스
- CI 잡: 대량 코드 리뷰를 프로그램적으로
- 커스텀 CLI: 특정 업무 전용 에이전트

**클로드 코드를 쓸 수 있는 상황이면 그걸 그냥 쓰세요.** SDK는 "CLI 밖 환경"에 필요한 것.

### TypeScript 예

```typescript
import { Agent } from "@anthropic-ai/agent-sdk";

const agent = new Agent({
  model: "claude-sonnet-4-6",
  systemPrompt: "사내 DB 질의를 담당하는 에이전트.",
  tools: [
    {
      name: "query_db",
      description: "읽기 전용 SQL 실행",
      inputSchema: { type: "object", properties: { sql: { type: "string" } } },
      handler: async ({ sql }) => {
        const rows = await db.query(sql);
        return { content: [{ type: "text", text: JSON.stringify(rows) }] };
      },
    },
  ],
  mcpServers: [
    { command: "npx", args: ["-y", "@modelcontextprotocol/server-slack"] },
  ],
});

const result = await agent.run("지난 주 활성 사용자 수?");
console.log(result.text);
```

`tools`는 **직접 정의한 도구**를, `mcpServers`는 **기존 MCP 서버**를 붙입니다. 클로드 코드와 같은 퍼미션 모델·훅 시스템을 그대로 씁니다.

### Python 예

```python
from anthropic_agent_sdk import Agent

agent = Agent(
    model="claude-sonnet-4-6",
    system_prompt="QA 자동화 에이전트",
    tools=[...],
    mcp_servers=[...],
)

result = agent.run("이번 빌드의 회귀 테스트 돌려 줘")
print(result.text)
```

### 메모리·퍼미션·훅

SDK에도 클로드 코드의 핵심 기능이 똑같이 들어 있습니다.

```typescript
const agent = new Agent({
  ...
  memory: {
    load: async () => readFile("./agent-memory.md"),
  },
  permissions: {
    allow: ["query_db", "mcp__slack__post_message"],
    deny: ["mcp__slack__delete_channel"],
  },
  hooks: {
    onToolUse: async (event) => {
      await auditLog(event);
    },
  },
});
```

"클로드 코드처럼 동작하는 에이전트"를 내 앱 안에서 돌리는 셈.

### 관리형 에이전트 (Managed Agents)

Anthropic이 호스팅하는 관리형 버전도 있습니다. 내 앱에서 HTTP로 호출만 하면 되고, 실행 인프라는 Anthropic이 관리합니다.

```typescript
const result = await fetch("https://api.anthropic.com/v1/agents/my-agent/run", {
  method: "POST",
  headers: { "x-api-key": KEY },
  body: JSON.stringify({ input: "작업 지시" }),
}).then(r => r.json());
```

코드 실행 환경을 자체 운영하고 싶지 않을 때 좋은 경로. 보안·컴플라이언스 요건이 강한 조직에 특히.

## 셋이 함께 쓰이는 구조

실무에서는 세 계층이 같이 돕니다.

```
제품 (예: 사내 챗봇)
  └─ Agent SDK로 심음
      └─ 플러그인(스킬 모음)을 로드
          └─ 각 스킬은 결정론적 스크립트 사용
              └─ 공용 MCP 서버에 연결
```

- **제품 레벨** — Agent SDK로 감싸 API화
- **팀 표준** — 플러그인으로 묶어 버전 관리
- **세부 작업** — 스킬 단위로 쪼갬
- **외부 연결** — MCP 서버로 표준화

이 계층이 정착되면 "조직의 AI 역량"이 재사용 가능한 자산으로 누적됩니다.

## 선택 가이드

| 상황 | 답 |
|------|-----|
| 내 반복 작업 자동화 | 스킬 |
| 팀 표준 배포 | 플러그인 |
| 커뮤니티에 공유 | 플러그인 (마켓플레이스) |
| 슬랙·디스코드 봇 | Agent SDK |
| 웹 앱에 대화 인터페이스 | Agent SDK |
| 대용량 자동 처리 | Agent SDK + Batch API |
| 사내 지식 Q&A | Agent SDK + MCP (NotebookLM 등) |

## 함정들

### 스킬을 플러그인화 안 함

팀에서 각자 `.claude/skills/`를 복붙하는 것보다 **플러그인으로 패키징**이 항상 이깁니다. 버전 관리, 업데이트, 롤백이 가능.

### Agent SDK를 클로드 코드 대체로 잘못 씀

SDK는 **CLI가 아닌 환경**을 위한 겁니다. 로컬에서 개발하는데 SDK로 에이전트 돌리는 건 장점보다 단점이 큽니다. 그냥 클로드 코드 쓰세요.

### 플러그인 의존성 지옥

플러그인이 특정 Python 패키지·Node 버전을 요구하는데 팀원 환경이 제각각이면 설치가 실패합니다. **의존성 최소화·문서화·버전 고정**이 필수.

### 마켓플레이스 검증 미흡

타사 플러그인은 훅·스크립트가 포함되어 있어 **임의의 명령을 실행**할 수 있습니다. 설치 전 `plugin.json`과 스크립트를 한 번은 훑어 보세요.

## 요약

- **스킬** = 한 작업, 한 파일
- **플러그인** = 여러 스킬의 배포 단위
- **Agent SDK** = 클로드 코드 밖에서 에이전트 심기

시작은 스킬, 팀에 퍼뜨릴 때 플러그인, 제품화할 때 SDK. 순서만 지키면 길을 잃지 않습니다.

오늘 한 번 해 볼 일: 자주 쓰는 스킬 두세 개를 `my-plugin/`으로 묶어 `claude plugin install ./my-plugin`. 작은 실험이지만 "에이전트 엔지니어링"의 출발점입니다.

---

*Agent SDK 상세는 [Claude Agent SDK 공식 문서](https://docs.claude.com/en/agents-and-tools/agent-sdk)에서, 플러그인 명세는 [공식 플러그인 문서](https://code.claude.com/docs/en/plugins)에서 확인할 수 있습니다.*
