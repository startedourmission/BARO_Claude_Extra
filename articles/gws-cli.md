# gws CLI로 구글 워크스페이스 통합 에이전트 구축하기

> 하나의 커맨드라인 도구로 드라이브, 지메일, 캘린더, 시트, 닥스, 챗, 어드민까지. AI 에이전트에게 우리 워크스페이스를 통째로 맡기는 법.

## 들어가며

업무의 상당 부분이 구글 워크스페이스에서 벌어집니다. 메일을 읽고, 캘린더를 잡고, 드라이브를 뒤지고, 시트에 정리하고, 챗으로 알립니다. 그런데 에이전트에게 이 일들을 시키려고 하면 벽에 부딪힙니다. 각 서비스마다 별도의 MCP, 별도의 스코프 설정, 별도의 스키마가 있고, **그래서 결국 반쯤만 되고 반쯤은 수작업**으로 끝나죠.

구글이 2026년 3월에 공개한 [**gws CLI**](https://github.com/googleworkspace/cli)는 이 파편화를 한꺼번에 정리합니다. 하나의 CLI가 구글 워크스페이스 **모든 API**를 Discovery Service에서 동적으로 읽어 노출하고, 응답은 전부 구조화된 JSON으로 내려줍니다. 즉, **에이전트가 워크스페이스 전체를 읽고 쓸 수 있는 단일 입구**가 생긴 겁니다.

공개 3일 만에 깃허브 스타 4,900개, 해커뉴스 1위를 찍었습니다. 이 부록에서는 뭐가 달라졌는지, 어떻게 설치하고, 클로드 코드와 어떻게 엮는지를 정리합니다.

> **주의:** `gws`는 구글의 `googleworkspace` 조직 아래에서 공개된 오픈소스지만, "공식 지원 제품은 아니"라고 README에 명시되어 있습니다. 활발히 개발 중이고 v1.0까지는 breaking changes가 있을 수 있습니다.

## 기존 방식이 왜 불편했나

구글 워크스페이스를 에이전트에 붙이는 기존 경로들:

- **서비스별 MCP 서버** — gmail-mcp, drive-mcp, calendar-mcp를 각각 설치. 스코프 관리도 각자
- **Zapier·Make** — 외부 SaaS 경유. 보안 의심스럽고, 세밀한 API는 못 씀
- **Apps Script** — 쓸 수는 있지만 에이전트 오케스트레이션과 결이 안 맞음
- **공식 SDK 직접 호출** — Node/Python 기반 래퍼 코드 매번 작성

공통 문제:
1. API가 새로 나오면 도구가 따라오지 못함
2. 에이전트가 각 서비스의 차이를 일일이 학습해야 함
3. 스키마가 없어서 에이전트가 파라미터 포맷을 자주 틀림

## gws가 푸는 방식

gws의 설계 포인트는 세 가지입니다.

### 1. 동적으로 구성되는 커맨드 표면

gws는 명령어 목록을 **코드에 박아 두지 않습니다.** 실행 시점에 [Google Discovery Service](https://developers.google.com/discovery)를 읽고 전체 API 표면을 동적으로 구성합니다. 새 API 엔드포인트가 구글에서 추가되면 gws는 자동으로 인식합니다. 도구 버전을 올리지 않아도 됩니다.

### 2. 모든 응답이 구조화된 JSON

`gws drive files list ...`는 사람이 읽기 좋은 표가 아니라 **파이프로 흘려보내기 좋은 JSON**을 뱉습니다. 에이전트에게 주기에 이상적인 형태입니다. 파라미터도 JSON으로 받습니다(`--params`, `--json`).

### 3. 에이전트 스킬 40개 이상 번들

gws는 "**AI 에이전트 스킬**" 40여 개를 함께 제공합니다. 각 스킬은 특정 작업(예: "미팅 로그 남기기", "인보이스 메일 정리")을 수행하는 지침 묶음입니다. 클로드 코드·코덱스·제미나이가 이 스킬을 그대로 읽어 행동합니다.

### 4. MCP 서버 모드 내장

가장 실용적인 기능. `gws mcp` 하나로 MCP 서버가 기동되어, 클로드 데스크톱이나 클로드 코드에서 바로 툴로 쓸 수 있습니다.

## 설치

### 권장: 바이너리 다운로드

```bash
# macOS Homebrew
brew install googleworkspace-cli

# Linux / macOS (npm wrapper — 적절한 바이너리를 내려받아 줌)
npm install -g @googleworkspace/cli

# Nix
nix run github:googleworkspace/cli

# Cargo (빌드)
cargo install --git https://github.com/googleworkspace/cli --locked
```

또는 [GitHub Releases](https://github.com/googleworkspace/cli/releases)에서 OS/아키텍처에 맞는 바이너리를 받아 `$PATH`에 두면 됩니다.

### 사전 준비

- Node.js 18+ (npm 설치 경로를 쓸 때만)
- Google Cloud 프로젝트 하나 — OAuth 자격 증명용. `gcloud`가 있으면 `gws auth setup`이 자동으로 만들어 줍니다
- 구글 워크스페이스 접근 권한이 있는 구글 계정

## 인증 흐름

### 로컬 데스크톱 (가장 빠름)

```bash
gws auth setup     # 일회성: Cloud 프로젝트 생성, API 활성화, 로그인까지 자동
gws auth login     # 이후 로그인/스코프 재선택
```

`gws auth setup`은 내부적으로 `gcloud` CLI를 호출해 프로젝트·클라이언트·OAuth 동의 화면을 한 번에 구성합니다. 자격 증명은 AES-256-GCM으로 암호화되어 OS 키링에 저장됩니다(또는 파일 백엔드).

### 스코프 고르기

기본 `recommended` 프리셋은 85개 이상 스코프를 요구합니다. OAuth 앱이 "테스트 모드"면 구글이 ~25개로 제한하므로 `@gmail.com` 계정에서는 실패합니다. 실제로는 필요한 서비스만 골라 씁니다.

```bash
gws auth login -s drive,gmail,calendar,sheets
```

### 기타 방식

- `GOOGLE_WORKSPACE_CLI_TOKEN` 환경변수 — 이미 있는 OAuth 액세스 토큰 사용
- 서비스 계정 — 서버-서버 자동화용, `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE` 지정
- `gws auth setup` 없이 수동 OAuth 클라이언트 생성도 가능

## 기본 사용감

사람이 치기 좋은 형태로도, 파이프로 흘려보내기 좋은 형태로도 동작합니다.

```bash
# 최근 파일 10개
gws drive files list --params '{"pageSize": 10}'

# 스프레드시트 생성
gws sheets spreadsheets create --json '{"properties": {"title": "Q1 Budget"}}'

# Chat 메시지 전송 (dry-run으로 요청만 미리보기)
gws chat spaces messages create \
  --params '{"parent": "spaces/xyz"}' \
  --json '{"text": "Deploy complete."}' \
  --dry-run

# 메서드의 스키마 확인
gws schema drive.files.list

# 전체 페이지 NDJSON 스트림으로
gws drive files list --params '{"pageSize": 100}' --page-all | jq -r '.files[].name'
```

모든 리소스에 `--help`가 걸려 있고, `--dry-run`으로 요청 본문만 미리 볼 수 있고, `--page-all`로 자동 페이지네이션됩니다. 이 세 기능이 "에이전트 친화적"이라는 말의 실체입니다.

## 클로드 코드와 엮기 — 세 가지 경로

gws는 세 가지 방식으로 에이전트에게 붙일 수 있습니다. 상황에 따라 골라 씁니다.

### 경로 A — MCP 서버 모드 (가장 추천)

가장 깔끔한 통합입니다.

```bash
# 필요한 서비스만 노출
gws mcp -s drive,gmail,calendar
```

이 명령이 MCP 서버를 기동하면, 클로드 코드에 등록해 둘 수 있습니다.

```bash
claude mcp add gws -- gws mcp -s drive,gmail,calendar,sheets,chat
```

이제 클로드 세션에서 "내 드라이브에서 이번 주 수정된 문서 목록 줘"라고 말하면 클로드가 gws의 `drive.files.list` 툴을 직접 호출합니다. 각 툴의 스키마는 gws가 Discovery Service에서 받아 자동으로 내려주므로, 클로드는 파라미터를 정확히 맞춰 호출합니다.

### 경로 B — 에이전트 스킬 번들 사용

gws에는 40개 이상의 번들 스킬이 딸려옵니다. 각 스킬은 특정 워크플로를 수행하도록 사전 설계된 SKILL.md입니다. 예: "주간 스탠드업 요약", "영수증 메일 → 시트 정리", "캘린더 충돌 감지".

```bash
# 설치된 스킬 목록 보기
gws skills list

# 특정 스킬을 클로드 코드 스킬 폴더로 설치
gws skills install weekly-digest --to ~/.claude/skills/
```

설치된 스킬은 클로드 코드에서 `/weekly-digest`로 호출하거나, 관련 대화에서 자동 트리거됩니다.

### 경로 C — 제미나이 CLI 확장

gws는 Gemini CLI 확장도 포함합니다. 제미나이 사용자라면 터미널 인증 한 번으로 같은 gws 커맨드와 스킬을 제미나이 에이전트가 쓸 수 있습니다. 사용 흐름은 MCP 경로와 거의 같습니다.

## 실전 예 — 주간 리뷰 자동화

가상의 주간 리뷰 워크플로를 짠다고 합시다.

1. 지난주 캘린더 이벤트 중 1시간 이상짜리만 추출
2. 이벤트별로 참석자가 공유한 문서 링크 수집
3. 각 문서의 최근 수정 이력 확인
4. 챗 채널에 요약 전송

gws MCP로 이걸 클로드에게 시키면 대략 이런 흐름이 됩니다.

```text
> 지난주 내 캘린더에서 1시간 이상 회의 뽑아줘.
  각 회의에서 공유된 문서도 같이 정리해.

(클로드가 gws의 calendar.events.list, drive.files.get 호출)

> 이 회의들에서 언급된 문서 중 이번 주에 수정된 건 뭐야?

(클로드가 drive.files.list with modifiedTime 필터 호출)

> 정리한 내용을 #eng-weekly 스페이스에 포스트해줘.
  dry-run으로 먼저 보여주고.

(클로드가 chat.spaces.messages.create --dry-run 호출, 확인 후 실제 전송)
```

핵심은 **클로드가 API 호출마다 스키마를 확인하지 않아도 된다**는 점입니다. gws가 Discovery Service에서 자동으로 가져와 MCP 툴 정의에 녹여 넣었기 때문에, 클로드는 "어떤 파라미터를 줘야 하는지" 이미 알고 있습니다.

## 환경 변수와 배치 운영

CI나 서버에서 gws를 돌릴 때 유용한 변수들:

| 변수 | 용도 |
|------|------|
| `GOOGLE_WORKSPACE_CLI_TOKEN` | 미리 발급받은 액세스 토큰 사용 |
| `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE` | 서비스 계정 JSON 경로 |
| `GOOGLE_WORKSPACE_CLI_KEYRING_BACKEND` | `file`로 설정하면 OS 키링 대신 파일에 암호화 저장 |

모든 명령이 실패 시 non-zero exit code를 반환하므로, 스크립트에서 `&&` 체이닝이나 `set -e` 조합이 자연스럽게 먹힙니다. 출력이 NDJSON이므로 `jq`와의 궁합도 훌륭합니다.

## 한계와 주의점

### 비공식 프로젝트

앞서 말했듯 공식 지원 제품은 아닙니다. 엔터프라이즈 환경에서 중요 워크로드에 바로 투입하기 전에, 감사 로그 정책과 데이터 거버넌스 관점에서 IT 부서와 한 번 맞춰 볼 가치가 있습니다.

### 스코프 확장의 함정

`recommended`로 로그인하면 "아무 API나 다 되는" 상태가 됩니다. 편하지만 위험합니다. 에이전트에게 가벼운 작업만 시킨다면 `drive,calendar` 정도로 축소된 스코프로 돌리세요. 최소 권한 원칙은 LLM 시대에 더 중요해집니다.

### Breaking changes

v1.0 전이라 하위 호환성이 깨질 수 있습니다. 스킬·스크립트에서 `gws` 명령 표면에 의존하는 부분은 버전을 고정하거나, 주기적으로 스모크 테스트를 돌려 주세요.

### 구글 ToS

대량 스캐닝·자동 메일 전송 등 API 남용은 구글 워크스페이스 ToS 위반이 될 수 있습니다. 에이전트라고 예외가 아닙니다. 업무 자동화와 스팸·스크래핑의 경계는 신중하게.

## 어디에 쓰면 좋은가

- **주간·월간 리뷰 자동화** — 캘린더 + 드라이브 + 챗을 한 에이전트가 훑기
- **인보이스·영수증 정리** — 지메일에서 자동 라벨링 후 시트에 집계
- **문서 라이프사이클 관리** — 드라이브의 오래된/중복/orphan 파일 정리
- **사내 Q&A 봇** — 드라이브 문서를 근거로 챗에서 답변 (단, 민감 문서 접근 통제 필수)
- **미팅 준비 도우미** — 참석자, 최근 공유 문서, 관련 이전 메일을 한 뷰로

## 마치며

gws는 "LLM에게 구글 워크스페이스 전체 API를 **한 문으로** 열어 주는 도구"입니다. 각 서비스를 따로 붙이는 노력 없이, 오늘 설치해 내일 자동화를 시작할 수 있습니다. 구조화된 JSON·Discovery 기반 스키마·MCP 모드·번들 스킬이 모두 **"에이전트를 전제한 설계"**라는 한 가지 방향을 가리킵니다.

책 본문에서 MCP의 개념을 익혔다면, 주말 한 번 `gws auth setup` → `claude mcp add gws -- gws mcp -s drive,gmail,calendar`로 실험해 보세요. 주간 리뷰 한 번만 돌려 봐도, 수작업 워크스페이스 관리로 돌아가기 어려워집니다.

```bash
# 5분이면 세팅 끝
brew install googleworkspace-cli
gws auth setup
claude mcp add gws -- gws mcp -s drive,gmail,calendar,sheets,chat
```

---

*이 글은 [googleworkspace/cli](https://github.com/googleworkspace/cli) 저장소를 참고해 작성되었습니다. gws는 공식 지원 제품이 아닌 오픈소스이며, v1.0까지는 breaking changes가 있을 수 있습니다.*
