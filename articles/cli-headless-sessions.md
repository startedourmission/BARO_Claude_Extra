# CLI·헤드리스 모드와 세션 관리

> 클로드 코드를 **스크립트의 일부**로 쓰는 법. 그리고 긴 대화의 컨텍스트를 잃지 않고 이어 가는 법.

## 실행 방식 두 가지

### 인터랙티브 모드 (기본)

```bash
claude
```

터미널에 들어가 대화형으로 작업. 대부분의 경우 이 모드.

### 헤드리스 모드 (`-p`)

```bash
claude -p "docs 폴더의 오탈자를 고쳐 줘"
```

한 번 실행하고 종료. 입력 한 번, 출력 한 번. CI·스크립트·파이프라인에 박아 넣기 좋습니다.

## 자주 쓰는 CLI 플래그

| 플래그 | 용도 |
|--------|------|
| `-p <prompt>` | 헤드리스 — 프롬프트 주고 즉시 실행 후 종료 |
| `--continue` | 가장 최근 세션을 이어서 |
| `--resume` | 세션 목록에서 골라서 재개 |
| `--model <name>` | 모델 지정 (`opus`, `sonnet`, `haiku`) |
| `--add-dir <path>` | 작업 디렉터리 추가 (다중 가능) |
| `--mcp-config <file>` | 특정 MCP 설정 파일 사용 |
| `--output-format <fmt>` | 출력 형식 (`text`, `json`, `stream-json`) |
| `--dangerously-skip-permissions` | 모든 도구 자동 승인 (주의) |
| `--computer-use` | Computer Use 활성 |
| `--verbose` | 상세 로그 |

`claude --help`로 전체 목록 확인. 버전마다 추가됩니다.

## 출력 형식

### `--output-format text` (기본)

사람이 읽기 좋은 일반 텍스트 출력.

### `--output-format json`

세션 전체를 JSON으로. 스크립트 파싱에 좋습니다.

```bash
claude -p "이 함수의 시간복잡도?" --output-format json
```

```json
{
  "session_id": "abc123",
  "result": "O(n log n) ...",
  "usage": { "input_tokens": 342, "output_tokens": 87 },
  "cost_usd": 0.00012
}
```

### `--output-format stream-json`

NDJSON 스트림. 실시간 처리에 유용.

```bash
claude -p "큰 작업" --output-format stream-json | while read line; do
  echo "$line" | jq .type
done
```

각 라인이 이벤트 객체:

- `text` — 생성된 텍스트 청크
- `tool_use` — 도구 호출
- `tool_result` — 도구 결과
- `usage` — 토큰 집계

## 헤드리스 활용 예

### CI의 PR 리뷰

GitHub Actions에서 PR에 자동 리뷰를 다는 예:

```yaml
- name: Claude PR Review
  run: |
    DIFF=$(gh pr diff ${{ github.event.pull_request.number }})
    echo "$DIFF" | claude -p "이 diff를 한국어로 리뷰해. 버그·보안·성능 우선." \
      --output-format text \
      > review.md
    gh pr comment ${{ github.event.pull_request.number }} --body-file review.md
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 문서 대량 처리

```bash
for f in docs/*.md; do
  claude -p "이 파일의 핵심을 3줄 요약" < "$f" \
    --output-format text \
    > "summaries/$(basename $f)"
done
```

### 셸 파이프로 조합

```bash
git log --since="1 week ago" --oneline \
  | claude -p "이 커밋들로 주간 릴리스 노트 써 줘" \
  > RELEASE.md
```

### 셸 함수로 감싸기

`~/.zshrc`:

```bash
# 빠른 번역
trans() {
  claude -p "다음을 자연스러운 한국어로 번역: $*" \
    --model haiku \
    --output-format text
}

# 명령어 설명
explain() {
  man "$1" 2>/dev/null | claude -p "이 명령의 핵심 사용법 한국어로 정리" \
    --output-format text
}
```

매일 쓰는 도구로 변신.

## 세션 관리

### 세션은 자동 저장

클로드 코드는 모든 대화를 자동 저장합니다. 저장 위치:

- macOS: `~/Library/Application Support/ClaudeCode/sessions/`
- Linux: `~/.local/share/claude-code/sessions/`

세션 하나당 JSON 파일. 필요하면 직접 열어 과거 대화를 볼 수도 있습니다.

### `--continue`

가장 최근 세션을 이어 재개.

```bash
claude --continue
```

어제 끝냈던 대화 그대로 이어집니다.

### `--resume`

여러 세션 중 골라서 재개.

```bash
claude --resume
```

최근 N개 세션이 목록으로 뜨고, 선택 시 그 컨텍스트로 복귀.

## `/compact` vs `/clear`

### `/compact`

현재 대화를 **요약**으로 압축. 이전 내용의 핵심만 남기고 본문은 버립니다. 긴 세션 중 컨텍스트가 차 오를 때 수동 호출.

```
/compact
```

요약 후에도 히스토리는 유지되지만 토큰 소비가 줄어듭니다.

### `/clear`

현재 대화 **완전 초기화**. 이전 내용을 클로드가 더 이상 참고하지 않습니다. 새 작업으로 전환할 때.

```
/clear
```

원칙: **연관된 후속 작업이면 `/compact`, 주제 전환이면 `/clear`**.

## 자동 압축

컨텍스트 창이 한계에 다가가면 클로드 코드가 **자동으로 압축**을 시도합니다. 기본 동작:

1. 오래된 메시지부터 요약
2. 최근 N턴은 원문 유지
3. 호출된 스킬 중 최근 것은 우선 보존 (5000 토큰 한도)
4. 토큰 예산을 맞춤

자동 압축이 싫으면 비활성화도 가능 (`--no-auto-compact`), 하지만 거의 추천하지 않습니다. 컨텍스트가 꽉 차서 오류나느니 요약이 낫습니다.

### `PreCompact` 훅

자동 압축 직전 훅을 걸어 스냅샷을 떨어뜨릴 수 있습니다.

```json
{
  "hooks": {
    "PreCompact": [
      { "hooks": [{ "type": "command", "command": "~/.claude/snapshot.sh" }] }
    ]
  }
}
```

압축 직전의 전체 대화를 파일로 보존하고 싶을 때 유용.

## 세션 파일 직접 다루기

세션 JSON 파일은 구조가 문서화되어 있습니다. 주요 필드:

- `messages[]` — 대화 전체
- `tool_uses[]` — 호출된 도구
- `cache_stats` — 프롬프트 캐시 히트율
- `usage` — 토큰 집계
- `cost_usd` — 누적 비용 추정

`jq`로 분석하기:

```bash
SESSION=~/Library/Application\ Support/ClaudeCode/sessions/latest.json
jq '.usage' "$SESSION"
jq '.tool_uses | group_by(.name) | map({tool: .[0].name, count: length})' "$SESSION"
```

세션 히스토리 분석은 사용 패턴 파악·비용 최적화에 유용합니다.

## 컨텍스트 관리 전략

### 짧게 끊기

하나의 세션에서 너무 많은 주제를 섞지 마세요. **작업 단위로 `/clear`**가 원칙. 다른 세션에서 이어가도 나중에 `--resume`으로 돌아올 수 있습니다.

### 긴 출력은 파일로

클로드가 생성한 긴 결과물을 그대로 대화에 남기면 다음 턴부터 토큰 부담이 큽니다. **파일에 쓰라고 지시**하고 대화에서는 "저장했다"는 짧은 확인만 받으세요.

```
"요약은 summary.md에 저장하고, 대화에서는 파일 위치만 알려 줘"
```

### 큰 파일 참조

`@big-file.json` 같은 거대 참조는 토큰을 폭발시킵니다. 큰 파일은 **Explore 서브에이전트**에 "관련 부분만 읽어 와 달라"고 위임하세요.

### `/compact` 타이밍

한 작업이 끝났고 후속 작업으로 넘어가기 직전이 골든 타이밍. 작업 중간에 압축하면 세부 사항 손실이 아쉬워질 수 있음.

## CI·자동화 실전

### GitHub Actions 템플릿

```yaml
name: Nightly Docs Audit
on:
  schedule:
    - cron: '0 2 * * *'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropic/claude-code-action@v1
      - run: |
          claude -p "docs/ 아래 오래된 정보를 찾아 리포트해" \
            --output-format json > audit.json
          jq -r '.result' audit.json > audit.md
      - uses: actions/upload-artifact@v4
        with:
          name: audit
          path: audit.md
```

### 로컬 크론

`crontab -e`:

```
0 9 * * * claude -p "어제 커밋 요약 메일 내용으로 써 줘" \
  --model haiku \
  --output-format text \
  | mail -s "Daily digest" me@example.com
```

매일 아침 9시 요약이 메일로.

### 백그라운드 작업

긴 작업은 백그라운드로:

```bash
claude -p "거대한 리팩터링" --output-format json > result.json 2>&1 &
echo "PID $! — 나중에 확인"
```

## 함정들

### `-p` 모드에서 대화형 필요

`-p`로 시작한 작업이 "파일을 덮어써도 될까요?" 같은 확인을 요구하면 그냥 멈춥니다. 헤드리스에서는 **`allowed-tools`로 미리 승인**하거나 `--dangerously-skip-permissions`을 (신중히) 쓰세요.

### `--dangerously-skip-permissions` 남용

이름이 겁주는 이유가 있습니다. 모든 도구가 자동 실행되어 deny만 남습니다. 로컬 실험 외엔 피하세요.

### stream-json 파싱

스트림에 빈 객체나 에러 이벤트도 섞입니다. 견고한 파싱을 하려면 각 라인을 try/catch로 감싸세요.

### 세션 파일 용량

긴 세션은 수 MB까지 커집니다. 디스크 정리가 필요하면 오래된 세션을 주기적으로 비우세요.

```bash
find ~/Library/Application\ Support/ClaudeCode/sessions -mtime +90 -delete
```

### `--continue`의 위험

"그때 뭘 했지?" 모른 채 `--continue`하면 의도치 않은 작업을 이어 할 수 있습니다. 복귀 직후 한 번은 `/compact` 또는 요약을 받아서 현재 상태를 파악하세요.

## 요약

헤드리스 모드는 클로드 코드를 **대화형 도구**에서 **스크립팅 가능한 AI 빌드 블록**으로 바꿉니다. 셸 파이프와 결합해 자신의 워크플로에 녹이는 순간 체감 생산성이 한 단계 뛰어오릅니다.

시작은 한 줄:

```bash
claude -p "이 파일 한국어로 요약" < README.md
```

---

*CLI 플래그와 세션 명세는 [Claude Code 공식 CLI 문서](https://code.claude.com/docs/en/cli)에서 확인할 수 있습니다.*
