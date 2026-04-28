# NotebookLM MCP 사용 흐름

## 설치

```bash
claude mcp add notebooklm -- npx -y notebooklm-mcp@latest
```

## 초기 세팅

```text
# 1. 로그인 (Chrome 창이 뜸)
NotebookLM에 로그인해 줘

# 2. notebooklm.google.com에서 노트북 만든 뒤 공유 링크 복사
# 3. 라이브러리에 등록
이 링크를 "react, frontend" 태그로 라이브러리에 추가해 줘
https://notebooklm.google.com/notebook/YOUR_NOTEBOOK_ID

# 4. 작업 지시
[라이브러리] React 노트북 참고해서 드래그앤드롭 컴포넌트 만들어 줘.
코딩 전에 NotebookLM에 API 질문 몇 개 해서 정확히 확인하고 시작해.
```

## 도구 프로파일 (토큰 절약)

```bash
# 질의만 할 때 (5개 도구만 로드)
npx notebooklm-mcp config set profile minimal

# 라이브러리 관리까지
npx notebooklm-mcp config set profile standard
```

## 주의

- 브라우저 자동화 전용 구글 계정 권장 (주 계정 플래그 위험)
- NotebookLM 무료 티어는 일일 질의 한도 있음
