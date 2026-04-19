// 부록 목록 — slug는 articles/ 폴더 내 .md 파일 이름과 일치해야 합니다.
export const categories = [
  {
    name: "설명",
    items: [
      { slug: "sample", title: "클로드 코드 기능 지도" },
      { slug: "slash-commands", title: "슬래시 커맨드 완전 가이드" },
      { slug: "memory-system", title: "CLAUDE.md와 메모리 시스템" },
      { slug: "permissions-and-settings", title: "퍼미션과 설정 파일" },
      { slug: "modes-keybindings", title: "모드 전환과 키보드 단축키" },
      { slug: "hooks", title: "훅(Hooks) 완전 가이드" },
      { slug: "mcp-servers", title: "MCP 서버" },
      { slug: "subagents", title: "서브에이전트 설계" },
      { slug: "cli-headless-sessions", title: "CLI·헤드리스 모드와 세션 관리" },
      { slug: "models-thinking-cost", title: "모델·사고 모드·비용" },
      { slug: "plugins-skills-sdk", title: "플러그인·스킬·Agent SDK" },
    ],
  },
  {
    name: "활용",
    items: [
      { slug: "skill-scripts", title: "스크립트로 에이전트 스킬 고도화하기" },
      { slug: "karpathy-llm-wiki", title: "카파시의 LLM 위키 만들기" },
      { slug: "figma-mcp", title: "피그마 MCP로 디자인과 코드 잇기" },
      { slug: "awesome-design-md", title: "DESIGN.md로 프론트엔드 디자인하기" },
      { slug: "notebooklm-mcp", title: "클로드와 NotebookLM 연결하기" },
      { slug: "k-skill", title: "k-skill — 한국인을 위한 스킬 모음집" },
      { slug: "gws-cli", title: "gws CLI로 구글 워크스페이스 통합 에이전트 구축하기" },
      { slug: "xcode-ios-claude", title: "Xcode로 아이폰 앱 개발하기" },
      { slug: "home-assistant-claude", title: "홈어시스턴트 × 클로드로 집에 음성 비서 들이기" },
      { slug: "kakaotalk-computer-use", title: "Computer Use로 카카오톡 자동화하기" },
    ],
  },
];

export const articles = categories.flatMap(c => c.items);
