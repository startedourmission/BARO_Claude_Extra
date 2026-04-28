---
title: Attention Is All You Need 요약
type: summary
created: 2026-04-28
updated: 2026-04-28
sources: [attention-is-all-you-need.md]
---

# Attention Is All You Need (Vaswani et al., 2017)

## 핵심 주장

RNN·CNN 없이 순수 어텐션 메커니즘만으로 기계 번역 SOTA 달성 가능.

## 주요 방법

- [[transformer]] 아키텍처 제안
- [[attention|Multi-Head Attention]] 도입
- Positional Encoding으로 순서 정보 주입
- 인코더 6층 + 디코더 6층

## 주요 결과

- WMT 2014 영-독 번역: BLEU 28.4 (당시 최고)
- 학습 시간: 8 GPU, 3.5일 (기존 대비 획기적 단축)

## 한계

- 긴 시퀀스에서 메모리 O(n²) 문제
- Positional Encoding이 외삽(extrapolation)에 취약
