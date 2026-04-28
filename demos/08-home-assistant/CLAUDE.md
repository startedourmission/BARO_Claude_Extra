# 홈어시스턴트 Claude 연동 설정

## 연결 방식

### 경로 A — HA 안에 Claude 내장 (집에서 음성으로)

HA 설정 → Integrations → Anthropic 추가 → API 키 입력
→ Voice Assistants → 파이프라인 생성 → Conversation Agent: Anthropic

### 경로 B — Claude에서 집 제어 (Claude Code에서)

```bash
claude mcp add home-assistant \
  --transport http \
  --header "Authorization: Bearer YOUR_LONG_LIVED_TOKEN" \
  https://your.homeassistant.example.com/mcp
```

Long-Lived Token 발급: HA 프로필 → 하단 "Long-Lived Access Tokens"

## 엔티티 노출 관리

- HA의 "Expose to Assistants" 설정에서 자주 쓰는 것만 노출
- 카메라 스트림·로그 엔티티는 끄기 (프롬프트 비대화 방지)

## 자주 쓰는 요청 예

```text
거실 불 따뜻한 색으로 30% 밝기로 바꿔줘
오늘 집에 누가 언제 들어왔어?
잘 자 (조명 서서히 꺼주고, 열린 창문 있으면 알려줘)
회의 시작 (에어컨 약풍, 청소기 일시정지, 초인종 무음)
```
