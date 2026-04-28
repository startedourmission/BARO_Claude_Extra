# gws CLI 예시 워크플로

## 설치 및 연결

```bash
brew install googleworkspace-cli
gws auth setup          # 최초 1회
claude mcp add gws -- gws mcp -s drive,gmail,calendar,sheets,chat
```

## 기본 CLI 사용

```bash
# 최근 파일 10개
gws drive files list --params '{"pageSize": 10}'

# 스프레드시트 생성
gws sheets spreadsheets create --json '{"properties": {"title": "Q1 예산"}}'

# Chat 메시지 전송 (dry-run으로 미리보기)
gws chat spaces messages create \
  --params '{"parent": "spaces/xyz"}' \
  --json '{"text": "배포 완료."}' \
  --dry-run

# 메서드 스키마 확인
gws schema drive.files.list
```

## 클로드에게 자연어로

```text
지난주 내 캘린더에서 1시간 이상 회의 뽑아줘.
각 회의에서 공유된 문서도 같이 정리해.

이 회의들에서 언급된 문서 중 이번 주에 수정된 건 뭐야?

정리한 내용을 #eng-weekly 스페이스에 포스트해줘.
dry-run으로 먼저 보여주고.
```

## 주의

- `recommended` 스코프는 85개+ → 필요한 것만 지정
- v1.0 전이라 breaking changes 가능. 버전 고정 권장
- 대량 메일 전송 등 남용은 Google ToS 위반
