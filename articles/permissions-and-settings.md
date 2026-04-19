# 퍼미션과 설정 파일

> 매번 "허용하시겠어요?" 창을 누르는 피로를 없애고, 동시에 위험한 명령은 자동 차단하는 균형점. 팀 단위로 공유되는 정책까지.

## 설정 파일 계층

클로드 코드는 네 층의 설정을 병합합니다.

| 파일 | 위치 | 우선순위 | 용도 |
|------|------|----------|------|
| 엔터프라이즈 | OS별 관리 경로 | 최상위 | 조직 전체 정책. 사용자가 덮어쓸 수 없음 |
| 사용자 | `~/.claude/settings.json` | 2 | 개인 기본값 |
| 프로젝트 | `<repo>/.claude/settings.json` | 3 | 팀 공용 (git 커밋) |
| 프로젝트 로컬 | `<repo>/.claude/settings.local.json` | 최하위 | 개인 프로젝트 오버라이드 (gitignore) |

아래로 갈수록 우선순위가 낮지만, `deny`는 항상 이깁니다. 엔터프라이즈가 Bash를 deny하면 프로젝트 allow로 풀 수 없습니다.

## 퍼미션 규칙 기본

퍼미션은 **세 가지 결정**으로 이루어집니다.

- `allow` — 묻지 않고 실행
- `deny` — 절대 실행 금지
- `ask` — 매번 사용자에게 확인 (기본)

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run test)",
      "Bash(npm run lint)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Read(~/projects/**)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Write(**/.env*)",
      "Write(**/credentials*)"
    ],
    "ask": [
      "Bash(git push:*)",
      "Bash(git reset --hard*)"
    ]
  }
}
```

규정 안 한 도구 호출은 기본 `ask`로 처리됩니다.

## 패턴 문법

### 도구별 이름

도구 이름 그대로 씁니다: `Bash`, `Read`, `Write`, `Edit`, `Grep`, `Glob`.

### 인자 패턴

`Bash(명령)` 형식으로 구체화할 수 있습니다.

```
Bash(npm run test)       — 정확히 이 명령만
Bash(npm run test:*)     — npm run test로 시작하는 모든 인자
Bash(npm *)              — npm으로 시작하는 모든 명령
Bash(git diff:*)         — git diff로 시작 (공백 또는 :로 구분)
```

### 파일 경로

`Read(...)`, `Write(...)`는 glob 패턴 허용.

```
Read(~/.config/**)
Write(src/**/*.ts)
Read(**/*.md)
```

### MCP 도구

MCP 도구는 `mcp__<server>__<tool>` 네임스페이스입니다.

```
mcp__github__create_issue
mcp__postgres__query
mcp__filesystem__*      — filesystem 서버의 모든 도구
```

### 스킬

스킬 자체 호출을 제한할 수도 있습니다.

```
Skill(commit)            — 정확히 /commit만
Skill(review-pr *)       — /review-pr로 시작, 인자 아무거나
Skill                    — 모든 스킬
```

## 실전 설정

### 개인 `~/.claude/settings.json` — 기본 안전망

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Grep",
      "Glob",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(pwd)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Bash(curl * | sh)",
      "Bash(wget * | sh)",
      "Write(~/.ssh/**)",
      "Read(~/.ssh/id_*)"
    ]
  }
}
```

Read·Grep·Glob은 보통 부작용이 없어 열어 둘 만하고, 파괴적 셸은 절대 deny.

### 프로젝트 `.claude/settings.json` — 팀 공용

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm *)",
      "Bash(npx vitest*)",
      "Bash(gh pr view*)",
      "Bash(gh pr diff*)",
      "Edit(src/**)",
      "Write(src/**/*.ts)",
      "Write(src/**/*.tsx)",
      "Write(tests/**)",
      "mcp__postgres__query"
    ],
    "deny": [
      "Bash(pnpm publish*)",
      "Bash(rm -rf node_modules)",
      "Write(pnpm-lock.yaml)",
      "Write(**/.env*)"
    ]
  }
}
```

팀원 전부가 이 규칙을 공유합니다. 새로 입사한 개발자도 같은 안전망 안에서 작업.

### 프로젝트 로컬 `.claude/settings.local.json` — 개인용

```json
{
  "permissions": {
    "allow": [
      "Bash(docker *)",
      "Read(~/private-keys/**)"
    ]
  },
  "env": {
    "DEBUG": "myapp:*"
  }
}
```

개인이 자주 쓰는 명령을 추가 허용하거나, 개인 환경 변수를 설정. **반드시 gitignore**.

## 허용 프롬프트 줄이기 — `/less-permission-prompts`

반복해서 "허용하시겠어요?"가 뜨는 명령을 자동 수집해 allow에 추가하는 **스킬**입니다.

```
/less-permission-prompts
```

최근 세션 히스토리를 훑어, 자주 허용했던 명령·파일 접근을 분석해 **우선순위 allowlist**를 제안합니다. 사용자가 고르면 settings.json에 반영.

"매번 승인 피로"를 체계적으로 해결하는 가장 빠른 길.

## 환경 변수

퍼미션 외에 `env` 섹션으로 프로세스 환경변수를 설정할 수 있습니다.

```json
{
  "env": {
    "ANTHROPIC_MODEL": "claude-sonnet-4-6",
    "DEBUG": "1",
    "CLAUDE_CODE_DISABLE_TELEMETRY": "1"
  }
}
```

설정 계층 따라 병합됩니다 — 프로젝트 로컬의 env가 사용자 env를 덮어씁니다.

자주 쓰는 변수:

| 변수 | 용도 |
|------|------|
| `ANTHROPIC_API_KEY` | API 키 (로그인 대신) |
| `ANTHROPIC_MODEL` | 기본 모델 |
| `CLAUDE_CODE_USE_BEDROCK` | AWS Bedrock 경유 |
| `CLAUDE_CODE_USE_VERTEX` | Google Vertex 경유 |
| `DISABLE_TELEMETRY` | 텔레메트리 끄기 |
| `MAX_THINKING_TOKENS` | 사고 토큰 상한 |
| `SLASH_COMMAND_TOOL_CHAR_BUDGET` | 스킬 설명 글자 예산 |

## 훅 설정

`hooks` 필드로 이벤트 기반 자동화를 설정합니다 (상세는 훅 문서 참고).

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "bun run format" }]
      }
    ]
  }
}
```

훅도 계층 병합됩니다. 같은 이벤트의 여러 훅은 순차 실행.

## 상태줄 설정

터미널 하단 상태줄을 커스터마이즈.

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh"
  }
}
```

지정한 스크립트가 JSON으로 세션 정보를 받아 한 줄 문자열을 출력하면, 그 내용이 상태줄에 표시됩니다. 브랜치·모델·토큰 사용량 등을 실시간 보기 좋습니다.

## `/permissions` 커맨드

대화 중 `/permissions`를 치면 현재 적용 중인 규칙을 볼 수 있고, 새 규칙을 추가·제거할 수 있습니다. 설정 파일을 직접 편집하지 않고도 즉석 조정 가능.

## 검증 — `/doctor`

설정이 기대대로 병합됐는지 확인.

```
/doctor
```

표시되는 항목:

- 설정 파일 로드 경로와 순서
- 적용 중인 퍼미션 규칙
- 연결된 MCP 서버
- 훅 등록 상태
- 현재 모델·전송 설정

뭔가 안 먹을 때 제일 먼저 돌려야 할 명령.

## 엔터프라이즈 관리 설정

조직 차원 정책을 배포할 때 사용. 경로는 OS별 다름:

- macOS: `/Library/Application Support/ClaudeCode/managed-settings.json`
- Linux: `/etc/claude-code/managed-settings.json`
- Windows: `%ProgramData%\ClaudeCode\managed-settings.json`

내용 형식은 일반 settings.json과 같지만, **사용자가 덮어쓸 수 없습니다**. 조직에서 금지할 명령(sudo, curl | sh)이나 필수 훅(감사 로그)을 박아 두는 용도.

## 시나리오별 레시피

### "읽기는 자유롭게, 쓰기는 조심스럽게"

```json
{
  "permissions": {
    "allow": ["Read", "Grep", "Glob", "Bash(ls *)", "Bash(cat *)"],
    "deny": ["Write(**/.env*)", "Bash(rm *)"]
  }
}
```

코드 탐색·조사 작업에서 일일이 승인 창 뜨는 피로를 없앱니다.

### "CI/헤드리스 전용 세팅"

```json
{
  "permissions": {
    "allow": ["Bash(pnpm *)", "Bash(git *)", "Read", "Write(src/**)", "Edit(src/**)"],
    "deny": ["Bash(pnpm publish*)", "Bash(git push --force*)"]
  }
}
```

GitHub Actions에서 `claude -p`로 돌릴 때 상호작용 없이 안전하게.

### "개인 프로젝트 + 실험"

```json
{
  "permissions": {
    "allow": ["*"],
    "deny": ["Bash(rm -rf /)", "Bash(sudo rm *)"]
  }
}
```

혼자 로컬에서 노는 실험 저장소는 대부분 열어 두되, 대형 파괴만 막아 두는 정도가 현실적.

## 함정들

### `allow: "*"`의 유혹

편하다고 전부 허용하면 LLM이 의도 조작된 프롬프트에 반응해 `rm -rf`, `git reset --hard`, 토큰 유출 같은 실수를 합니다. **deny는 항상 꼼꼼히**.

### 로컬 설정에 비밀 저장

`.claude/settings.local.json`이 gitignore 안에 있는지 매 번 확인하세요. 공용 `.claude/settings.json`과 경로가 비슷해 실수로 커밋되는 사고가 흔합니다.

### 패턴 오탈자

`Bash(npm *)`는 `npm`으로 시작하는 **모든** 명령입니다. `npmx`나 `npm publish`도 포함. 정밀하게 쓰고 싶으면 `Bash(npm run *)`, `Bash(npm test *)`.

### 우선순위 헷갈림

엔터프라이즈 deny는 사용자 allow를 이깁니다. 반대로 사용자 deny는 프로젝트 allow를 이깁니다. 동작이 예상과 다르면 `/doctor`로 실제 적용 상태 확인.

### 훅이 deny를 우회하지 않음

훅은 셸에서 실행되므로 퍼미션 규칙과 무관합니다. 훅 안에서 `rm -rf`를 쓰면 그대로 실행됩니다. 훅 스크립트 자체를 안전하게 짜는 건 사용자 책임.

## 요약

퍼미션과 설정은 **자유도와 안전의 dial**입니다. 과하게 잠그면 매 클릭이 피로, 과하게 풀면 사고. 권장 시작점:

1. 사용자 레벨에 **Read류 allow + 파괴적 deny** 세팅
2. 프로젝트에 팀 공용 명령·파일 allow
3. `/less-permission-prompts`로 주기적으로 반복 승인 자동화
4. `/doctor`로 상태 점검

한 번 정착시키면 다음 한 달 동안 "허용하시겠어요?" 창을 열 일이 체감상 1/5로 줄어듭니다.

---

*퍼미션과 설정 상세는 [Claude Code 공식 permissions 문서](https://code.claude.com/docs/en/permissions)에 정리되어 있습니다.*
