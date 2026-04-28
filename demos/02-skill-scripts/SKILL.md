---
name: weekly-release-notes
description: sources/의 변경된 마크다운 파일을 감지해 릴리스 노트에 누적
allowed-tools: Bash(./scripts/*.py)
---

## 절차

1. 변경된 소스 파일 목록을 가져온다:

   !`./scripts/detect_changes.py`

2. 위 출력의 `changed` 배열을 보고, 각 파일의 핵심 변경 사항을 한 줄로 요약한다.
   (요약이 없으면 파일을 Read해서 내용 파악 후 요약)

3. 요약 JSON을 만들어 파일에 append한다:

   !`./scripts/append_notes.py '[{"title":"제목","summary":"요약"}]'`

## 스크립트 설명

- `scripts/detect_changes.py` — state/last-run.json 기준으로 변경된 파일을 JSON으로 출력
- `scripts/append_notes.py` — release-notes.md의 오늘 날짜 섹션에 항목을 추가

## 주의

- LLM은 2번 판단만 담당 (어떤 변경이 중요한가)
- 파일 I/O·날짜 처리·JSON 직렬화는 전부 스크립트가 처리
