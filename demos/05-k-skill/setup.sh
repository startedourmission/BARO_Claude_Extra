#!/usr/bin/env bash
# k-skill 설치 스크립트

set -e

echo "1. k-skill 전체 설치 (글로벌)..."
npx -y skills add NomaDamas/k-skill --all -g

echo ""
echo "2. 공통 설정..."
echo "  클로드에게 'k-skill-setup 스킬로 공통 설정 진행해 줘' 라고 말하세요"

echo ""
echo "3. 조회형만 먼저 써보려면:"
echo "  npx -y skills add NomaDamas/k-skill --skill kbo-results --skill lotto-results --skill korea-weather -g"
