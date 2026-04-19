# 슬래시 커맨드 완전 가이드

> `/` 한 글자에 담긴 확장성. 빌트인 커맨드를 다 꿰고, 직접 만들고, 팀에 퍼뜨리는 법.

## 개념 — 슬래시 커맨드 = 스킬

입력창에 `/`를 누르면 커맨드 팔레트가 열립니다. 클로드 코드에서 보이는 이 팔레트는 두 종류를 한 화면에 섞어 보여줍니다.

1. **빌트인 커맨드** — `/help`, `/clear`, `/compact` 같은 시스템 명령
2. **스킬(Skill)** — `.claude/commands/` 또는 `.claude/skills/`에 정의된 사용자 정의 커맨드

원래 "슬래시 커맨드"와 "스킬"은 별개 개념이었지만, 최근 버전에서 **두 개념이 병합**되었습니다. `.claude/commands/deploy.md` 파일과 `.claude/skills/deploy/SKILL.md` 파일 둘 다 `/deploy`로 실행됩니다. 기존 `commands/` 구조도 호환되지만, 새 작업은 스킬 디렉터리 형식을 권장합니다.

## 빌트인 커맨드 목록

세션·UI 관련:

| 커맨드 | 기능 |
|--------|------|
| `/help` | 전체 도움말 |
| `/clear` | 컨텍스트 완전 초기화 |
| `/compact` | 대화를 요약해 컨텍스트 압축 |
| `/cost` | 세션 토큰·비용 현황 |
| `/model` | 모델 선택 (Opus/Sonnet/Haiku) |
| `/config` | 설정 창 열기 |
| `/exit` | 세션 종료 |

프로젝트·개발 관련:

| 커맨드 | 기능 |
|--------|------|
| `/init` | 프로젝트 분석해 CLAUDE.md 자동 생성 |
| `/memory` | CLAUDE.md 파일들 편집 진입 |
| `/review` | 현재 변경/PR 리뷰 |
| `/pr_comments` | 깃허브 PR 코멘트 가져와 반영 |
| `/security-review` | 변경 사항 보안 관점 리뷰 |
| `/bug` | 버그 리포트 작성 도우미 |

운영·진단 관련:

| 커맨드 | 기능 |
|--------|------|
| `/doctor` | 설정/환경 진단 |
| `/permissions` | 권한 규칙 확인·편집 |
| `/mcp` | MCP 서버 목록·연결 상태 |
| `/agents` | 사용 가능한 서브에이전트 |
| `/plugins` | 플러그인 관리 |

기타:

| 커맨드 | 기능 |
|--------|------|
| `/ide` | 실행 중 IDE와 세션 연결 |
| `/terminal-setup` | 터미널 최적 설정 가이드 |
| `/vim` | vim 모드 |
| `/fast` | 빠른 응답 모드 (Opus 4.6 한정) |

정확한 목록은 `/help` 또는 공식 커맨드 레퍼런스로 확인하세요. 버전마다 추가·제거됩니다.

## 커스텀 슬래시 커맨드 만들기 — 가장 간단한 형태

`.claude/commands/` 또는 `~/.claude/commands/` 아래 마크다운 파일을 하나 만들면 됩니다. **파일 이름이 곧 커맨드 이름**입니다.

`.claude/commands/ko-review.md`:

```markdown
---
description: 현재 변경 사항을 한국어로 코드 리뷰
---

현재 `git diff` 결과를 읽고, 아래 기준으로 리뷰해 주세요.

1. **버그 가능성** — 엣지 케이스, 동시성, off-by-one
2. **성능** — 불필요한 반복, 과도한 메모리
3. **가독성** — 네이밍, 주석, 함수 크기

답변은 전부 한국어로.
```

저장하면 즉시 `/ko-review`로 실행됩니다. 팀원 전체가 공유하려면 `.claude/commands/`를 git에 커밋하세요.

## 스킬 디렉터리 형식 (더 강력)

단일 파일로 부족할 때, 스킬 디렉터리 형식을 씁니다. `SKILL.md`를 본체로, 스크립트·참고 문서·템플릿을 한 폴더에 둘 수 있습니다.

```
.claude/skills/weekly-digest/
├── SKILL.md                  # 본체 (필수)
├── reference.md              # 상세 레퍼런스 (필요 시만 로드)
├── scripts/
│   └── scan.py               # LLM이 실행만 하고 컨텍스트엔 안 올림
└── templates/
    └── digest.md             # 출력 템플릿
```

`SKILL.md` 예:

```markdown
---
name: weekly-digest
description: 주간 변경 로그를 생성한다 — git log + 이슈 추적 + 요약
allowed-tools: Bash(git log:*) Bash(gh issue:*)
---

## 절차

1. 지난 주 커밋: !`git log --since="1 week ago" --oneline`
2. 닫힌 이슈: !`gh issue list --state closed --search "closed:>$(date -v-1w +%Y-%m-%d)"`
3. 위 자료로 요약본 작성
4. `scripts/scan.py` 결과와 대조해 놓친 부분 보완
```

## 프론트매터 완전 레퍼런스

| 필드 | 기능 |
|------|------|
| `name` | 커맨드 이름. 생략 시 폴더명 사용 |
| `description` | 자동 트리거 판단용. 권장 필수 |
| `when_to_use` | 추가 트리거 힌트 |
| `argument-hint` | 자동완성 시 노출 힌트 (예: `[issue-number]`) |
| `disable-model-invocation` | `true`면 자동 트리거 금지. 수동 `/name`만 허용 |
| `user-invocable` | `false`면 메뉴에서 숨김. 모델만 자동 호출 |
| `allowed-tools` | 이 스킬 활성 시 묻지 않고 쓸 도구 |
| `model` | 이 스킬용 전용 모델 |
| `effort` | 이 스킬 동안 적용할 노력 레벨 (low/medium/high/xhigh/max) |
| `context` | `fork`로 설정 시 격리된 서브에이전트에서 실행 |
| `agent` | `context: fork`와 함께 — 어떤 서브에이전트로 |
| `hooks` | 이 스킬 생명주기 훅 |
| `paths` | 이 패턴의 파일을 다룰 때만 자동 활성 (예: `**/*.py`) |
| `shell` | `bash`(기본) 또는 `powershell` |

## 인수 전달

커맨드에 인수를 넘기고 싶으면 `$ARGUMENTS`를 씁니다.

```markdown
---
name: fix-issue
description: 깃허브 이슈를 읽고 고친다
---

깃허브 이슈 $ARGUMENTS를 고친다:

1. `gh issue view $ARGUMENTS`로 읽기
2. 해결책 설계
3. 구현 + 테스트
4. 커밋
```

`/fix-issue 123` → `$ARGUMENTS`가 `123`으로 치환.

여러 인수는 `$0`, `$1` 또는 `$ARGUMENTS[0]`, `$ARGUMENTS[1]`로:

```markdown
---
name: migrate
---

$0 컴포넌트를 $1에서 $2로 옮긴다.
```

`/migrate SearchBar React Vue` → `$0=SearchBar, $1=React, $2=Vue`.

## 동적 컨텍스트 — 셸 삽입

이 기능이 슬래시 커맨드를 진짜 강력하게 만듭니다. `` !`command` `` 문법으로 셸 명령을 실행하고 그 출력을 프롬프트에 박아 넣을 수 있습니다.

```markdown
---
name: pr-summary
description: 현재 PR 요약
---

## 자료
- 변경: !`gh pr diff`
- 코멘트: !`gh pr view --comments`
- 커밋 수: !`git rev-list --count main..HEAD`

## 할 일
위 자료로 한국어 요약을 작성.
```

클로드가 `SKILL.md`를 받아들일 때 세 개의 `` ! `` 블록이 **먼저 실행**되고, 그 출력이 프롬프트에 삽입됩니다. 클로드는 "이미 자료가 있는 상태"로 요약만 합니다. 토큰도 아끼고 품질도 올립니다.

다중 라인이 필요하면 ` ```! ` 펜스 블록을 쓰면 됩니다.

````markdown
## 환경
```!
node --version
npm --version
git status --short
```
````

## 제어 — 누가 부를 수 있나

| 프론트매터 조합 | 나 | 클로드 | 컨텍스트 로드 |
|------------------|-----|--------|---------------|
| (기본) | ✅ | ✅ | 설명이 항상 컨텍스트에, 호출 시 본문 로드 |
| `disable-model-invocation: true` | ✅ | ❌ | 설명 컨텍스트에 없음, 수동 호출 시만 로드 |
| `user-invocable: false` | ❌ | ✅ | 설명 컨텍스트에, 모델만 트리거 |

부작용이 큰 작업(`/deploy`, `/send-slack`)은 **`disable-model-invocation: true`** 걸어서 클로드가 멋대로 안 쓰게 막으세요. 배경 지식성 스킬(`/legacy-context`)은 **`user-invocable: false`**로 메뉴에서 숨깁니다.

## 저장 위치와 우선순위

| 위치 | 적용 범위 |
|------|-----------|
| `~/.claude/skills/` | 내 모든 프로젝트 |
| `<project>/.claude/skills/` | 이 프로젝트만 |
| `<plugin>/skills/` | 플러그인 활성화된 곳 |
| 엔터프라이즈 설정 | 조직 전체 |

충돌 시 우선순위: **엔터프라이즈 > 개인 > 프로젝트**. 플러그인 스킬은 `plugin-name:skill-name` 네임스페이스라 충돌 안 남.

## 라이브 갱신

세션 도중 `.claude/skills/` 안을 수정해도 **재시작 없이 반영**됩니다. 클로드 코드가 폴더를 감시합니다. 단, 최상위 스킬 디렉터리를 아예 새로 만드는 건 재시작이 필요합니다.

## 자주 하는 실수

### 설명 부실

```markdown
description: Helper for deploys
```

이러면 클로드가 언제 불러야 할지 판단 못 합니다. **트리거 문장·키워드**를 넣으세요.

```markdown
description: Deploy the application to production. Use when user says "배포해", "deploy", "push to prod", or after merging to main branch.
```

### 전부 인라인 본문으로 박기

긴 레퍼런스 문서를 SKILL.md 본문에 넣으면 호출할 때마다 전부 컨텍스트로 올라갑니다. **보조 파일**로 분리하고 "필요하면 `reference.md`를 읽으라"고 지시하세요.

### 부작용 스킬 자동 트리거

`/deploy`, `/publish`, `/send-message` 같은 게 모델 자동 호출로 열려 있으면 언젠가 사고가 납니다. **`disable-model-invocation: true`**를 잊지 마세요.

### 같은 이름 충돌

프로젝트와 개인에 같은 이름 스킬이 있으면 프로젝트가 이깁니다(개인이 우선이 아닙니다). 이름이 묘하게 안 먹을 때 `/doctor`로 확인.

## 확장 — 도구 허용과 훅

스킬이 자주 쓰는 도구는 `allowed-tools`로 미리 승인하세요. 매번 권한 프롬프트가 안 뜹니다.

```yaml
allowed-tools: Bash(git *) Bash(gh pr *) Read Grep
```

스킬 생명주기에 훅을 걸어 자동 검증·후처리도 가능합니다.

```yaml
hooks:
  PostToolUse:
    - command: "npm run format"
```

---

슬래시 커맨드는 클로드 코드의 **조립 유닛**입니다. 자주 반복하는 요청을 매번 타이핑하기 시작했다면, 그 프롬프트를 마크다운 한 장으로 추출해 팀 전체에 배포하세요. 개인 생산성과 팀 컨벤션이 동시에 잡힙니다.

---

*더 자세한 명세는 [Claude Code 공식 스킬 문서](https://code.claude.com/docs/en/skills)에서 확인할 수 있습니다.*
