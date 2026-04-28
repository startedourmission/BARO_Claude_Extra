#!/usr/bin/env bash
# NotebookLM MCP 설치 스크립트

set -e

echo "1. NotebookLM MCP 설치..."
claude mcp add notebooklm -- npx -y notebooklm-mcp@latest

echo ""
echo "2. 설치 확인..."
claude mcp list

echo ""
echo "✓ 설치 완료. 이제 클로드에게 말하세요:"
echo "  'NotebookLM에 로그인해 줘'"
