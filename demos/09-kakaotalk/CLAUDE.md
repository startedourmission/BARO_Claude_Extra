# 카카오톡 자동화 규칙

## 도구 선택

- 텍스트 읽기·검색·전송: kakaocli를 우선 사용
- 이모티콘·파일·스크롤 있는 UI: Computer Use 사용
- 두 도구 모두 전송 전 사용자 확인 필수

## 금지 사항

- 금융·의료·법률 관련 대화에 자동 응답 금지
- 광고성 대량 발송 금지
- 사용자 확인 없이 메시지 전송 금지

## kakaocli 주요 명령

```bash
# 텍스트 읽기
kakaocli messages list --room "가족" --limit 20

# 텍스트 전송 (확인 후)
kakaocli messages send --room "가족" --text "퇴근 중"

# 방 검색
kakaocli rooms search "프로젝트"
```

## 준비 사항

```bash
# kakaocli 설치
brew install silver-flight-group/tap/kakaocli

# macOS 권한 (시스템 설정에서 수동 허용)
# 개인정보 보호 → 화면 녹화 → [터미널/클로드] 체크
# 개인정보 보호 → 손쉬운 사용 → [터미널/클로드] 체크

# 절전 방지 (자동화 중)
caffeinate -dims &
```
