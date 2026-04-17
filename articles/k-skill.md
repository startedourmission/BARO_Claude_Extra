# k-skill — 한국인을 위한 스킬 모음집

> SRT 예매부터 쿠팡 검색, 로또 당첨 확인, 법령 검색까지. 한국 생활에서 자주 마주치는 잡무를 AI 에이전트에게 맡기는 방법.

## 들어가며

클로드 코드나 Codex 같은 코딩 에이전트를 실제 업무에서 쓰다 보면, "**이게 되면 좋은데**" 싶은 국내 특화 기능들이 아쉽게 느껴질 때가 많습니다. SRT 예매, KBO 경기 결과, 쿠팡 가격 비교, 한국 법령 검색, 카카오톡 메시지 확인처럼 한국에서 매일 쓰지만 해외 LLM 플랫폼이 직접 챙겨주기 어려운 영역이죠.

[NomaDamas/k-skill](https://github.com/NomaDamas/k-skill)은 이런 공백을 메우는 오픈소스 스킬 모음집입니다. 한 번 설치해 두면 "SRT로 다음 주 금요일 부산행 예매해 줘", "이 택배 송장 어디 있어?" 같은 요청을 에이전트에게 그대로 던질 수 있습니다.

이 글에서는 k-skill의 구조와 설치 흐름, 그리고 실제로 어떻게 활용하는지를 정리합니다.

## 무엇을 할 수 있나

k-skill이 포함하는 기능은 크게 다섯 갈래로 나눌 수 있습니다.

### 교통·이동

- **SRT / KTX 예매** — 열차 조회, 예약, 예약 확인, 취소
- **서울 지하철 도착정보** — 역 기준 실시간 도착 예정 열차
- **하이패스 영수증** — 사용 내역 조회 및 영수증 발급
- **근처 가장 싼 주유소** — 현재 위치 기준 최저가 주유소
- **택배 배송조회** — CJ대한통운·우체국 송장 상태

### 쇼핑·생활

- **쿠팡 / 다이소 / 올리브영 / 마켓컬리** — 상품 검색, 재고, 가격
- **번개장터** — 중고 매물 검색과 상세 조회
- **중고차 가격 조회** — 인수가·월 렌트료 비교
- **근처 술집 조회** — 영업 상태·메뉴·좌석 포함

### 정보·문서

- **한국 법령 검색** — 법령·조문·판례·유권해석
- **한국 특허 정보** — 키워드/출원번호 검색
- **한국 주식 정보** — KRX 상장 종목 기본정보, 일별 시세
- **토스증권 조회** — 계좌 요약, 포트폴리오, 시세
- **조선왕조실록** — 키워드/왕/연도별 검색
- **HWP 문서 처리** — `.hwp` → JSON/Markdown/HTML 변환

### 스포츠·엔터테인먼트

- **KBO 경기 결과** — 날짜별 일정·결과·팀 필터
- **K리그 경기 결과** — K리그1/K리그2 결과, 현재 순위
- **LCK 경기 분석** — 결과, 순위, 밴픽, 패치 메타
- **로또 당첨 확인** — 최신 회차, 번호 대조

### 환경·공공

- **한국 날씨** — 기상청 단기예보
- **사용자 위치 미세먼지** — PM10/PM2.5 조회
- **한강 수위 정보** — 관측소 기준 수위·유량
- **한국 부동산 실거래가** — 아파트·오피스텔·빌라 실거래가
- **학교 급식 식단** — NEIS 기반 급식 조회
- **의약품/식품 안전 체크** — 식약처 기반 회수·부적합 조회

이 외에도 **카카오톡 Mac CLI**, **한국어 맞춤법 검사**, **한국어 글자 수 세기**, **네이버 블로그 리서치**, **우편번호 검색** 등 자잘하지만 자주 필요한 도구들이 함께 들어 있습니다.

## 설치 흐름

### 가장 빠른 방법: 에이전트에게 그대로 맡기기

클로드 코드에 아래 문장을 그대로 붙여 넣으면 설치가 끝납니다.

```text
NomaDamas/k-skill 레포의 설치 문서를 읽고
k-skill 전체 스킬을 먼저 설치해줘.
설치가 끝나면 k-skill-setup 스킬을 사용해서
credential 확보와 환경변수 확인까지 이어서 진행해줘.
끝나면 설치된 스킬과 다음 단계만 짧게 정리해.
```

에이전트가 `install.md`를 읽고 아래에서 설명할 명령을 알아서 실행합니다. 설치 후에는 `k-skill-setup`이라는 메타 스킬이 자동으로 따라와, 필요한 경우에만 시크릿을 요구합니다.

### 직접 설치

수동으로 하고 싶다면 `skills` CLI를 씁니다. npm/pnpm/bun 중 하나만 있으면 됩니다.

```bash
# 전체 설치 (권장)
npx --yes skills add NomaDamas/k-skill --all -g

# 목록만 확인
npx --yes skills add NomaDamas/k-skill --list

# 설치 반영 확인
npx --yes skills ls -g
```

설치가 끝나면 공통 설정을 진행합니다.

```text
k-skill-setup 스킬을 사용해서 공통 설정을 진행해줘.
```

### 선택 설치

조회형만 먼저 가볍게 써보고 싶다면 필요한 스킬만 골라 설치할 수 있습니다.

```bash
npx --yes skills add NomaDamas/k-skill \
  --skill kbo-results \
  --skill lotto-results \
  --skill korea-weather \
  --skill delivery-tracking \
  --skill coupang-product-search
```

인증이 필요한 기능만 쓰고 싶을 때는 `k-skill-setup`도 함께 넣어 둡니다.

```bash
npx --yes skills add NomaDamas/k-skill \
  --skill k-skill-setup \
  --skill srt-booking \
  --skill ktx-booking
```

## 인증이 필요한 기능과 아닌 기능

k-skill의 설계 원칙 중 하나는 **"사용자가 직접 시크릿을 들고 있어야 하는 스킬을 최소화한다"**입니다. 예를 들어 부동산 실거래가나 한국 주식 정보는 겉보기엔 공공데이터포털 API 키가 필요할 것 같지만, `k-skill-proxy`라는 공용 프록시 서버가 중간에서 처리해 줘서 사용자 쪽에선 키 없이 바로 쓸 수 있습니다.

**사용자 로그인/시크릿이 필요한 스킬** (대표)

- `srt-booking` — SRT 로그인
- `ktx-booking` — Korail 로그인
- `toss-securities` — 토스증권 로그인
- `hipass-receipt` — 하이패스 로그인
- `korean-patent-search` — KIPRIS 발급 API 키

나머지는 대부분 공용 프록시 또는 공개 API를 통해 **키 없이** 동작합니다.

## 실전 사용 예

설치가 끝난 뒤에는 평소처럼 자연어로 요청하면 됩니다. 에이전트가 해당 스킬을 알아서 불러옵니다.

```text
> 다음 주 월요일 아침 서울→부산 SRT 예매해 줘.
  09시 이전 출발, 가능하면 특실.

> 최근 KBO 5경기 결과 정리해 주고,
  기아 타이거즈 경기만 따로 보여줘.

> 이 송장번호 123456789012 어디쯤 와 있어?

> "회사에서 해고당했을 때 실업급여 조건"이 궁금해.
  한국 법령에서 근거 조항 찾아줘.

> 지금 내 위치 기준으로 가장 싼 주유소 3곳 알려줘.
  리터당 가격이랑 거리 같이.

> 쿠팡에서 "무선 청소기" 30만 원 이하 중
  로켓배송 되는 것만 비교해 줘.

> 이번 주 로또 당첨번호 확인하고,
  내가 산 번호 7 14 22 31 35 42 + 보너스 5랑 대조해 줘.
```

이런 요청이 "한 번에" 처리된다는 게 k-skill의 가장 큰 매력입니다. 각 API의 엔드포인트와 파라미터를 내가 공부하지 않아도, 스킬의 지침이 에이전트에게 그 맥락을 제공합니다.

## 설치 시 주의점

### Node·Python 런타임

일부 스킬은 내부적으로 Node 패키지(`@ohah/hwpjs`, `kbo-game`, `k-lotto` 등)나 Python 패키지(`SRTrain`, `korail2`, `pycryptodome`)를 씁니다. 런타임이 없으면 전역 설치가 필요합니다.

```bash
# Node 계열
npm install -g @ohah/hwpjs kbo-game kleague-results lck-analytics \
  toss-securities hipass-receipt k-lotto coupang-product-search \
  used-car-price-search cheap-gas-nearby market-kurly-search daiso

# Python 계열
python3 -m pip install SRTrain korail2 pycryptodome
```

### macOS 전용 스킬

**카카오톡 Mac CLI**는 npm이 아니라 Homebrew tap을 씁니다.

```bash
brew install silver-flight-group/tap/kakaocli
```

토스증권 CLI도 별도 tap으로 설치합니다.

```bash
brew tap JungHoonGhae/tossinvest-cli
brew install tossctl
```

### 법령 검색은 추가 설정

`korean-law-search`는 스킬 설치 이후 upstream MCP 서버를 별도로 준비해야 합니다. 가장 빠른 경로는 remote endpoint 등록입니다.

```text
MCP 서버에 아래 URL을 등록:
https://korean-law-mcp.fly.dev/mcp

(응답이 없으면 fallback)
https://api.beopmang.org/mcp
```

로컬 설치를 원한다면 `korean-law-mcp`를 전역으로 깔고 `LAW_OC` 환경변수에 API 키를 넣습니다.

## 스킬을 직접 만들고 싶다면

k-skill의 각 기능은 그 자체가 **재사용 가능한 스킬**입니다. `k-skill-proxy`라는 프록시 서버 + `skills add` CLI + 기능별 `SKILL.md`라는 세 축으로 구성되어 있고, 같은 패턴을 따라 자기만의 스킬을 만들 수 있습니다.

이 부록에서는 "사용자 관점의 설치/활용"까지만 다뤘지만, 자기 조직을 위한 내부 도구를 비슷한 방식으로 공개하고 싶다면 k-skill의 저장소 구조 자체가 좋은 본보기가 됩니다. `docs/features/*.md`의 서술 패턴과 `skills/*/SKILL.md`의 지침 작성 방식을 따라가 보세요.

## 마치며

k-skill은 "LLM이 한국인의 일상을 진짜로 거들 수 있는가"라는 질문에 현실적인 답을 주는 프로젝트입니다. 하나하나 보면 대단한 기능은 아니지만, **묶어 놓았기 때문에** 일상 자동화의 출발점이 됩니다.

책 본문에서 스킬 개념을 익혔다면, 오늘 저녁 `skills add NomaDamas/k-skill --all -g` 한 줄을 실행해 보세요. 다음 번 "내가 이걸 왜 수작업으로 하고 있지?" 싶은 순간에 자연스럽게 클로드를 불러 쓸 수 있습니다.

---

*이 글은 NomaDamas/k-skill 저장소 기준으로 작성되었습니다. 포함 기능은 계속 늘어나고 있으니 [공식 레포](https://github.com/NomaDamas/k-skill)에서 최신 목록을 확인하세요.*
