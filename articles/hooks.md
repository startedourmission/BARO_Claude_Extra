# 훅(Hooks) 완전 가이드

> 클로드의 행동에 **결정론적 자동화**를 끼워 넣는 장치. 저장하면 자동 포맷, 위험 명령은 실행 전 차단, 세션 끝나면 리포트. 훅이 없으면 "부탁하는 LLM", 있으면 "우리 팀 규칙을 따르는 LLM".

## 개념

훅은 **클로드 코드의 특정 이벤트에 맞춰 자동 실행되는 셸 명령**입니다. `~/.claude/settings.json` 또는 프로젝트의 `.claude/settings.json`에 정의합니다.

동작 방식:

```
클로드가 도구 호출 → 해당 이벤트의 훅이 먼저 실행
  → 훅이 비-zero 종료면 도구 호출 차단 (또는 허용)
  → 출력을 컨텍스트에 주입할 수도 있음
```

왜 중요한가:

- LLM에게 "린터 돌려 줘"라고 말해도 **까먹을 수 있음**
- 훅은 **반드시 돈다** (설정했다면)
- 결정론 부분은 훅에게, 판단은 LLM에게 — 역할 분담이 깔끔

## 이벤트 전체 목록

| 이벤트 | 언제 |
|--------|------|
| `PreToolUse` | 도구 호출 직전. 차단·검증 가능 |
| `PostToolUse` | 도구 호출 완료 후. 후처리·알림 |
| `UserPromptSubmit` | 사용자가 메시지 보낸 직후 |
| `Stop` | 응답 생성이 끝났을 때 |
| `SubagentStop` | 서브에이전트 종료 시 |
| `Notification` | 알림 발생 시 (작업 완료, 입력 대기 등) |
| `SessionStart` | 세션 시작 시 |
| `SessionEnd` | 세션 종료 시 |
| `PreCompact` | 자동 압축 직전 |

## 기본 문법

```json
{
  "hooks": {
    "<이벤트명>": [
      {
        "matcher": "<매칭 패턴>",
        "hooks": [
          {
            "type": "command",
            "command": "<셸 명령>"
          }
        ]
      }
    ]
  }
}
```

- `matcher` — 정규식 또는 도구명. 해당 조건에만 훅 실행
- `command` — 실행할 셸 명령. 환경변수로 입력을 받을 수 있음

환경 변수로 넘어오는 값(이벤트마다 다름):

- `CLAUDE_TOOL_NAME` — 실행되는 도구 이름 (Read, Edit, Bash 등)
- `CLAUDE_TOOL_INPUT` — 도구 호출 인자 JSON
- `CLAUDE_SESSION_ID` — 현재 세션 ID
- `CLAUDE_PROJECT_DIR` — 프로젝트 루트 경로

## 레시피 1 — 저장 시 자동 포맷

파일을 쓰거나 편집할 때마다 프로젝트 포맷터가 돌아갑니다.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bun run format:fix"
          }
        ]
      }
    ]
  }
}
```

ESLint·Prettier·Ruff·gofmt — 각 언어의 포맷터를 걸면 **"클로드가 뭘 했든 스타일은 일관"**이 보장됩니다.

## 레시피 2 — 위험 명령 사전 차단

`rm -rf /`, `DROP TABLE` 같은 위험한 Bash를 실행 전에 막습니다.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'jq -r .command <<< \"$CLAUDE_TOOL_INPUT\" | grep -qE \"rm -rf|DROP TABLE|truncate\" && echo \"Blocked: destructive command\" && exit 1 || exit 0'"
          }
        ]
      }
    ]
  }
}
```

훅이 `exit 1`로 끝나면 클로드 코드는 그 도구 호출을 차단하고, stderr를 LLM 컨텍스트에 전달합니다. 클로드가 "막혔네, 다른 방법 찾아야지"라고 판단해 안전한 대안을 씁니다.

## 레시피 3 — 커밋 메시지 검증

커밋 직전에 메시지 규칙을 검증합니다.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/validate-commit.sh"
          }
        ]
      }
    ]
  }
}
```

`validate-commit.sh`:

```bash
#!/bin/bash
CMD=$(jq -r .command <<< "$CLAUDE_TOOL_INPUT")
if [[ "$CMD" == git\ commit* ]]; then
  MSG=$(echo "$CMD" | sed -n 's/.*-m "\(.*\)".*/\1/p')
  if [[ ! "$MSG" =~ ^(feat|fix|docs|chore|refactor): ]]; then
    echo "커밋 메시지는 feat:|fix:|docs:|chore:|refactor: 로 시작해야 합니다"
    exit 1
  fi
fi
```

## 레시피 4 — 테스트 자동 실행

파일 수정 후 자동으로 관련 테스트를 돌립니다.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'FILE=$(jq -r .file_path <<< \"$CLAUDE_TOOL_INPUT\"); [[ \"$FILE\" == *.ts ]] && npx vitest related \"$FILE\" --run'"
          }
        ]
      }
    ]
  }
}
```

LLM에게 "테스트 돌려 줘"를 매번 말할 필요가 없어집니다. 실패하면 `exit 1`로 막고, LLM이 자동으로 수정 시도에 들어갑니다.

## 레시피 5 — 세션 종료 요약

`SessionEnd`에서 오늘 작업 요약을 로그에 남깁니다.

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo \"[$(date)] 세션 $CLAUDE_SESSION_ID 종료\" >> ~/.claude/session.log"
          }
        ]
      }
    ]
  }
}
```

팀·조직 차원에서 사용량·작업 추적이 필요할 때 유용합니다.

## 레시피 6 — 알림 소리

작업이 완료되면 소리로 알립니다 (macOS).

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "afplay /System/Library/Sounds/Glass.aiff"
          }
        ]
      }
    ]
  }
}
```

긴 작업을 돌려 놓고 다른 일 하다가 끝나는 순간 알 수 있습니다.

## 레시피 7 — 민감 파일 보호

`.env`, `*.key`를 쓰거나 읽는 시도를 차단합니다.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Read",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'jq -r .file_path <<< \"$CLAUDE_TOOL_INPUT\" | grep -qE \"\\.env$|\\.key$|credentials\" && echo \"Blocked: sensitive file\" && exit 1 || exit 0'"
          }
        ]
      }
    ]
  }
}
```

퍼미션 시스템으로도 비슷한 보호를 걸 수 있지만, 훅은 **실행 시점 검증**이라 더 유연합니다.

## 레시피 8 — 컨텍스트에 정보 주입

`UserPromptSubmit`에서 현재 git 상태를 컨텍스트에 자동 추가.

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "git status --short"
          }
        ]
      }
    ]
  }
}
```

이러면 사용자가 매번 "지금 뭐 수정됐어?"를 물어보지 않아도 클로드가 현재 상태를 파악하고 답변을 시작합니다.

## 레시피 9 — 프리커밋 훅 재활용

이미 `.git/hooks/pre-commit`이 있다면, `PreToolUse`에서 그걸 호출.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'jq -r .command <<< \"$CLAUDE_TOOL_INPUT\" | grep -q \"git commit\" && .git/hooks/pre-commit || exit 0'"
          }
        ]
      }
    ]
  }
}
```

## 레시피 10 — 자동 압축 전 체크포인트

`PreCompact`에서 현재 대화를 파일로 저장.

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo \"Session $CLAUDE_SESSION_ID compacted at $(date)\" >> ~/.claude/compact.log"
          }
        ]
      }
    ]
  }
}
```

대화 압축 전 상태를 로그하거나, 특정 파일 기준점을 스냅샷으로 남기는 등 용도가 다양.

## 설정 파일 계층

훅은 여러 곳에서 정의할 수 있고, 병합됩니다.

- `~/.claude/settings.json` — 개인 훅 (모든 프로젝트 공통)
- `<repo>/.claude/settings.json` — 프로젝트 팀 공용 (git 커밋)
- `<repo>/.claude/settings.local.json` — 개인용 프로젝트 설정 (gitignore)

같은 이벤트에 여러 훅이 등록되면 **모두 순차 실행**됩니다.

## 훅을 스킬 내부에 넣기

특정 스킬 활성 중에만 적용되는 훅은 스킬 프론트매터에 둘 수 있습니다.

```yaml
---
name: deploy
hooks:
  PreToolUse:
    - command: "~/.claude/hooks/deploy-guard.sh"
---
```

`/deploy` 스킬이 활성화된 동안만 `deploy-guard.sh`가 돕니다. 스킬별로 규칙을 분리할 때 편리합니다.

## 디버깅

훅이 왜 안 도는지 확인하려면:

1. `/doctor` — 설정 파일 경로와 병합 상태 확인
2. `echo "$CLAUDE_TOOL_INPUT" >> /tmp/hook.log` — 입력값 찍어보기
3. 훅 자체를 터미널에서 먼저 수동 실행해 exit code 확인
4. JSON 이스케이프 조심 — `"` 안의 `"`는 `\"`

## 함정들

### 무한 루프

`PostToolUse`에서 또 도구를 호출하는 명령을 걸면 (예: `claude -p ...`) 무한 루프가 됩니다. 훅 안에서는 **얇은 셸 명령만**.

### 성능 영향

모든 도구 호출마다 훅이 돌면 지연이 쌓입니다. **정말 매번 필요한가?** 파일 저장은 세션 끝에 한 번만 포맷하는 `Stop` 훅으로 충분할 수 있습니다.

### exit 1을 남발하지 말기

위험 차단은 정당하지만, **애매한 경우에도 exit 1로 막으면** 클로드가 같은 시도를 반복하며 막히는 루프가 됩니다. 차단할 때는 stderr에 **이유와 대안**을 적어 주세요.

```bash
echo "Blocked: direct .env access. Use process.env instead." >&2
exit 1
```

### 플랫폼 차이

`afplay`는 macOS 전용, `notify-send`는 Linux 전용. 팀에 여러 OS가 섞이면 `.claude/settings.local.json`(개인 파일)에 두거나 OS 분기 스크립트로.

### 권한 프롬프트

훅이 실행하는 명령은 **클로드 코드의 권한 규칙과 무관**하게 쉘에서 바로 실행됩니다. 그 명령 자체가 위험하다면 스크립트 내에서 검증 로직을 둬야 합니다.

## 요약

훅은 **LLM의 부탁을 규칙으로 바꾸는 장치**입니다. 잘 쓰면:

- 팀 컨벤션이 **도구 레벨**에서 강제됨 (까먹을 수 없음)
- 위험한 사고가 **사전에** 걸러짐
- 반복 작업이 **자동으로** 돎

처음엔 `PostToolUse`에 포맷터 하나만 걸어 보세요. 한 번 체험하면 왜 훅이 강력한지 즉시 체감됩니다.

---

*훅 이벤트별 상세 명세는 [Claude Code 공식 훅 문서](https://code.claude.com/docs/en/hooks)에서 확인할 수 있습니다.*
