#!/usr/bin/env bash
# XcodeBuildMCP 설치 및 설정

set -e

echo "1. XcodeBuildMCP 설치..."
claude mcp add xcode -- npx -y xcodebuildmcp@latest

echo ""
echo "2. 설치 확인..."
claude mcp list | grep xcode

echo ""
echo "✓ 완료. CLAUDE.md 템플릿이 이 폴더에 있습니다."
echo "  Xcode 프로젝트 루트로 복사해 쓰세요."
echo ""
echo "사용 예:"
echo "  '홈 화면에 오늘의 할 일 섹션 추가해 줘. Observable 기반 TodoStore 만들고 SwiftUI List로 렌더링.'"
echo "  '이 뷰의 스크린샷 보여줘.'"
