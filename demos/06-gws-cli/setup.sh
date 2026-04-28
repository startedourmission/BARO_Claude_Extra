#!/usr/bin/env bash
# gws CLI 설치 및 Claude Code MCP 연결

set -e

echo "1. gws CLI 설치..."
brew install googleworkspace-cli

echo ""
echo "2. 인증 설정 (최초 1회)..."
echo "  실행: gws auth setup"
echo "  → Google Cloud 프로젝트 생성 + OAuth 동의 화면 자동 구성"
echo "  → 로그인 화면 뜸"

echo ""
echo "3. 필요한 스코프만 선택하는 로그인:"
echo "  gws auth login -s drive,gmail,calendar,sheets"

echo ""
echo "4. Claude Code MCP 등록:"
echo "  claude mcp add gws -- gws mcp -s drive,gmail,calendar,sheets,chat"

echo ""
echo "✓ 완료 후 클로드에게:"
echo "  '지난주 내 캘린더에서 1시간 이상 회의 뽑아줘'"
