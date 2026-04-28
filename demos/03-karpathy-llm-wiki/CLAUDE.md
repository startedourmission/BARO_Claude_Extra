# LLM Wiki Schema

이 저장소는 개인 지식 위키입니다. 세션을 시작하면 아래 구조와 규칙을 따르세요.

## 폴더 구조

- `sources/` — 원본 자료. 절대 수정하지 않음
- `wiki/concepts/` — 추상 개념 페이지
- `wiki/entities/` — 인물·조직·제품 페이지
- `wiki/summaries/` — 개별 소스 요약
- `wiki/index.md` — 전체 목차
- `logs/` — 날짜별 작업 기록

## 페이지 템플릿

모든 위키 페이지는 아래 프론트매터로 시작:

```yaml
---
title: 페이지 제목
type: concept | entity | summary
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: [사용한 원본 파일 목록]
---
```

## 작명 규칙

- 파일명: kebab-case (`positional-encoding.md`)
- 위키링크: `[[positional-encoding]]` 형태
- 제목: 한글 우선, 영문 병기는 괄호로

## 연산 정의

### /ingest <파일경로>

sources/의 파일을 읽고 summaries/에 요약 페이지 생성.
concepts·entities 페이지 증분 갱신.
index.md와 logs/ingest-{오늘날짜}.md 업데이트.

### /query <질문>

wiki/를 탐색해 답변 생성. 인용 페이지 표기.
새 통찰은 관련 페이지 하단 "Notes from {날짜}" 섹션에 추가.

### /lint

모순, 고아 페이지, 끊긴 링크, 누락된 교차 링크 점검.
결과를 lint-report-{오늘날짜}.md로 저장.

## 금지 사항

- 원본(sources/) 수정 금지
- 벡터 DB나 임베딩 인프라 도입 금지 (인덱스 파일로 충분)
- 페이지를 다시 처음부터 쓰지 말 것. 항상 증분 갱신
