# 스크립트로 에이전트 스킬 고도화하기

> skill-creator로 처음 만든 스킬이 점점 같은 일을 반복한다면, 그 부분을 스크립트로 빼 두세요. 토큰이 절약되고 결과가 결정론적이 됩니다.

## 들어가며

에이전트 스킬을 만들고 나면 처음엔 마법 같습니다. `/my-skill` 한 번에 일이 처리되니까요. 그런데 쓰다 보면 이상한 게 눈에 들어옵니다. 같은 일을 시킬 때마다 LLM이 **같은 계산을 처음부터 다시** 합니다. 같은 JSON을 파싱하고, 같은 정규식을 돌리고, 같은 포맷팅 로직을 재발명합니다. 토큰은 꾸준히 소모되고, 결과는 미묘하게 달라지기도 합니다.

해결책은 단순합니다. **결정론적인 부분은 LLM이 하지 말고 스크립트가 하게 만든다.** 이 부록은 그 리팩터링 과정을 정리합니다. skill-creator로 초안을 뽑는 단계부터, 반복 부분을 찾아 uv 기반 Python 스크립트로 옮기는 단계, 그리고 얻는 토큰 절감까지.

## 왜 스크립트인가 — 컨텍스트에 안 들어간다

Claude Code 스킬 시스템의 가장 중요한 특성 하나를 먼저 짚습니다.

> **스크립트 파일은 컨텍스트에 로드되지 않습니다. LLM은 스크립트를 `Bash`로 실행하고, 그 "출력"만 토큰으로 받습니다.**

이게 왜 중요한지 예를 들어 봅시다. 로그 파일에서 특정 패턴을 추출하는 스킬이 있다고 합시다.

- **안 좋은 버전** — SKILL.md에 정규식과 파싱 규칙을 자연어로 풀어 쓰고, LLM이 매번 `Read`로 로그를 읽어 머릿속에서 필터링. 컨텍스트에 로그 전체가 올라가고, LLM은 한 줄씩 판정합니다. 100MB 로그면 아예 불가능.
- **좋은 버전** — SKILL.md는 "로그 분석이 필요하면 `scripts/analyze.py`를 실행하라"고만 적고, 정규식·파싱은 파이썬 코드가 처리. LLM은 **결과 요약만** 받습니다. 입력은 수십 MB여도, 출력은 수백 바이트.

같은 일을 스크립트로 옮기면 보통 **토큰이 10~100배 줄고**, 결과의 재현성도 크게 올라갑니다.

## 1단계 — skill-creator로 초안 만들기

처음부터 잘 쪼갠 스킬을 만들기는 어렵습니다. 먼저 **프롬프트 전부를 SKILL.md에 박아 넣은 초안**을 만들고, 써보면서 고도화하는 편이 현실적입니다.

Anthropic이 제공하는 `skill-creator` 스킬을 쓰면 됩니다(커뮤니티 버전도 다수 있습니다). 기본 흐름은 이렇습니다.

```text
/skill-creator

어떤 스킬을 만들고 싶은지 설명:
매주 월요일에 sources/ 폴더의 마크다운 문서들을 읽고,
변경 사항을 뽑아 release-notes.md에 누적 기록하는 스킬.
```

skill-creator는 질문을 몇 번 던진 뒤 `~/.claude/skills/weekly-release-notes/SKILL.md` 같은 초안을 만들어 줍니다. 이 초안에는 LLM이 수행해야 할 모든 단계가 자연어로 적혀 있습니다.

이 단계에서 얻는 건 **"된다"**는 확인이지, **"효율적이다"**는 확인이 아닙니다. 실제로 돌려 보면 문제가 드러납니다.

- 매번 같은 `diff` 비교 로직을 LLM이 반복
- 마크다운 파싱을 문장 단위로 수행해 토큰 소비가 큼
- 결과가 매번 조금씩 다름 (섹션 순서, 헤더 레벨 등)

여기서부터 스크립트화가 시작됩니다.

## 2단계 — 대체 가능한 부분 찾기

스킬 실행을 한두 번 관찰하면서 **"LLM이 결정해야 할 일"**과 **"결정론적 연산"**을 구분합니다.

| 유지할 것 (LLM의 일) | 스크립트로 옮길 것 |
|----------------------|--------------------|
| "어떤 변경이 중요한가" 판단 | 파일 목록 스캔, diff 계산 |
| 자연어 요약 생성 | 마크다운 헤딩 추출 |
| 우선순위 매기기 | JSON 직렬화, 날짜 포맷 |
| 최종 문서 톤 결정 | 파일 I/O, 경로 resolution |
| 모호한 케이스 판단 | 정규식 매칭, 카운팅 |

규칙: **"입력이 같으면 출력이 항상 같아야 하는 일"은 전부 스크립트로.** LLM의 창의성이 필요한 부분만 SKILL.md에 남깁니다.

찾는 신호:
- 스킬이 돌 때 `Read`가 여러 번 연속 호출됨 → 파일 스캔을 스크립트로
- LLM이 같은 파싱을 반복 → 파서를 스크립트로
- 출력이 고정 포맷 → 포매터를 스크립트로
- 숫자 집계가 들어감 → 절대 스크립트로 (LLM은 산수를 틀림)

## 3단계 — uv로 Python 스크립트 준비하기

스크립트 언어는 뭐든 됩니다만, 에이전트 스킬에서는 **uv + Python** 조합이 가장 편합니다.

### uv가 뭔데

[uv](https://github.com/astral-sh/uv)는 Rust로 만든 Python 패키지 매니저입니다. pip·pipx·poetry·pyenv를 한 번에 대체하면서 **10~100배 빠릅니다.** 에이전트 맥락에서 진짜 장점은 속도가 아니라 **"세팅이 거의 없다"**는 점입니다.

### 설치

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Homebrew
brew install uv

# npm (최근 추가됨)
npm install -g uv-bin
```

설치 후 `uv --version`으로 확인합니다. 파이썬이 없으면 uv가 알아서 받아옵니다.

### PEP 723 인라인 메타데이터 — 핵심 기법

uv의 킬러 기능은 **스크립트 안에 의존성을 박아 넣는 것**입니다. `requirements.txt`, `pyproject.toml`, 가상환경 — 전부 없이 파이썬 파일 하나로 끝납니다.

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "rich>=13.0",
#   "python-frontmatter>=1.0",
# ]
# ///

import frontmatter
from rich import print
from pathlib import Path

def main():
    for path in Path("sources").glob("*.md"):
        post = frontmatter.load(path)
        print(f"[bold]{path.name}[/bold]: {post.get('title', '(untitled)')}")

if __name__ == "__main__":
    main()
```

이 파일을 `scripts/scan_sources.py`로 저장하고 실행 권한을 주면 끝입니다.

```bash
chmod +x scripts/scan_sources.py
./scripts/scan_sources.py
```

첫 실행 시 uv가 의존성을 캐시된 가상환경에 깔아 두고, 그 뒤로는 수 밀리초 안에 실행됩니다. **가상환경 관리도, 설치 안내도 필요 없습니다.**

## 4단계 — SKILL.md에서 스크립트 호출하게 고치기

초안 SKILL.md가 이렇게 생겼다고 합시다.

```markdown
---
name: weekly-release-notes
description: sources/의 변경 사항을 릴리스 노트로 누적
---

1. sources/ 폴더의 모든 .md 파일을 읽는다
2. 각 파일의 프론트매터에서 title, updated-at을 추출한다
3. last-run.json과 비교해 변경된 파일만 골라낸다
4. 변경된 파일별로 한 줄 요약을 만든다
5. release-notes.md의 오늘 섹션에 추가한다
```

이 중 1·2·3·5는 결정론적입니다. LLM의 판단이 필요한 건 4번뿐.

리팩터된 SKILL.md:

```markdown
---
name: weekly-release-notes
description: sources/의 변경 사항을 릴리스 노트로 누적
allowed-tools: Bash(./scripts/*.py)
---

## 절차

1. 변경된 소스 파일 목록과 메타데이터를 가져온다:

   !`./scripts/detect_changes.py`

2. 위 출력의 `changed` 배열을 보고, 각 파일의 핵심 변경 사항을
   한 줄로 요약한다. (이 단계가 네 일이다.)

3. 요약본을 표준 포맷으로 파일에 append:

   !`./scripts/append_notes.py '<JSON 요약>'`

## 스크립트 설명

- `scripts/detect_changes.py` — last-run.json과 sources/의 차이를
  계산해 `{changed: [...], skipped: [...]}` JSON을 출력
- `scripts/append_notes.py` — release-notes.md의 오늘 섹션에
  표준 포맷으로 항목을 추가
```

차이가 보이시나요?

- **SKILL.md의 분량이 짧아졌습니다** (토큰 절감)
- **LLM이 해야 할 판단이 명확해졌습니다** (품질 향상)
- **결정론적 부분은 스크립트가 담당합니다** (재현성)

`` !`command` `` 문법은 SKILL.md 안에서 **렌더링 전 단계에 실행**되어 결과가 프롬프트에 삽입됩니다. LLM은 이미 `detect_changes.py`가 돌아간 "결과"를 받아서 요약만 시작합니다.

## 5단계 — 폴더 구조 잡기

정착된 고도화 스킬의 전형적인 구조:

```
~/.claude/skills/weekly-release-notes/
├── SKILL.md                    # 짧은 오케스트레이션 지침
├── reference.md                # LLM이 필요할 때만 로드 (템플릿, 포맷 규칙)
├── scripts/
│   ├── detect_changes.py       # uv inline deps
│   ├── append_notes.py         # uv inline deps
│   └── _common.py              # 공통 헬퍼 (스크립트에서만 import)
└── state/
    └── last-run.json           # 스크립트가 읽고 쓰는 상태 파일
```

지침 중 일부만 뽑습니다.

- **SKILL.md**는 500줄 이내, 핵심 오케스트레이션만
- **reference.md** 같은 보조 파일은 링크만 걸고, "필요하면 이 파일을 Read" 수준의 지침
- **scripts/**는 각자 자립적으로 실행 가능 (PEP 723 메타데이터 활용)
- **state/**는 스크립트가 관리. LLM은 직접 건드리지 않음

## 실측: 토큰은 얼마나 절약되나

같은 릴리스 노트 작업을 세 가지 방식으로 돌려 본 대략적인 숫자입니다(사내 로그 기준, 정확한 값은 스킬·데이터마다 다릅니다).

| 방식 | 입력 토큰 | 출력 토큰 | 실행 시간 | 재현성 |
|------|-----------|-----------|-----------|--------|
| CLAUDE.md에 규칙 풀어 쓰기 | ~18,000 | ~3,500 | 45초 | 낮음 |
| 스킬 초안 (SKILL.md만) | ~8,000 | ~2,000 | 30초 | 보통 |
| 스킬 + 스크립트 | **~1,500** | ~800 | 10초 | 높음 |

**10배 이상의 토큰 절감**과 **3배 이상의 속도 향상**이 흔한 결과입니다. 스킬을 자주 돌릴수록 차이는 누적됩니다.

## 자주 하는 실수

### 스크립트가 너무 똑똑해진다

스크립트에 "자연어 요약"을 넣으려고 LLM API를 호출하기 시작하면 본말이 전도됩니다. **LLM의 일은 LLM에게, 결정론의 일은 스크립트에게.** 경계가 흐려지면 다시 쪼개세요.

### 스크립트가 LLM 의존 입력을 받는다

LLM이 자연어로 만든 JSON을 스크립트 인자로 전달하는 건 괜찮지만, **스크립트의 핵심 로직이 자연어 파싱이면** 안 됩니다. 그건 LLM의 영역입니다. 스크립트는 이미 구조화된 입력을 받아 움직입니다.

### allowed-tools 범위를 안 건다

`Bash(./scripts/*.py)`로 범위를 고정해 두세요. 없으면 스크립트 실행마다 권한 프롬프트가 뜨거나, 반대로 의도 밖의 Bash 호출이 열립니다.

### 상태 파일을 git에 커밋한다

`state/last-run.json` 같은 런타임 산출물은 `.gitignore`에 넣습니다. 실수로 커밋하면 팀원끼리 상태가 꼬입니다.

## 한발 더 — 빌드 스크립트 같은 배포 자동화

스킬 안의 스크립트가 쌓이면 **스킬 자체의 CI**를 돌릴 수 있습니다.

```bash
# 프로젝트 루트에서
uv run pytest ~/.claude/skills/weekly-release-notes/tests/
```

스크립트가 깨지면 스킬도 깨지므로, 테스트 한 번으로 "스킬 동작 확인"이 됩니다. SKILL.md의 자연어 부분은 테스트하기 어렵지만, **스크립트 영역은 일반 파이썬 코드**이므로 pytest·ruff·mypy를 그대로 먹일 수 있습니다. 이게 스크립트 이관의 숨은 보너스입니다.

## 마치며

스킬을 만들 땐 "자연어로 풀어 쓰기 → 관찰 → 결정론 부분을 스크립트로 이관"의 순서를 기본으로 삼으세요. 처음부터 완벽하게 나눌 필요 없습니다. 일단 돌고 나서, 반복이 보이면 그 부분만 `scripts/`로 옮기고 SKILL.md를 줄입니다.

이 한 번의 리팩터만 거쳐도 스킬은 **더 빠르고, 더 싸고, 더 믿을 수 있게** 됩니다. 그리고 그 차이는 스킬을 자주 돌릴수록 복리로 쌓입니다.

---

*uv의 PEP 723 인라인 메타데이터와 Claude Code의 Skills 명세는 [Claude Code 공식 문서](https://code.claude.com/docs/en/skills)와 [uv 공식 문서](https://docs.astral.sh/uv/)에 최신 상태가 정리되어 있습니다.*
