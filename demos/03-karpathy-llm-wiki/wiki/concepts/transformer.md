---
title: 트랜스포머 (Transformer)
type: concept
created: 2026-04-28
updated: 2026-04-28
sources: [attention-is-all-you-need.md]
---

# 트랜스포머

인코더-디코더 구조로 이루어진 시퀀스-투-시퀀스 모델. 2017년 Google이 공개.

## 핵심 특징

- RNN 없이 순수 [[attention]] 메커니즘만으로 시퀀스 처리
- 병렬 처리 가능 → 학습 속도 획기적 향상
- Positional Encoding으로 순서 정보 보완

## 구성 요소

- Multi-Head Self-Attention
- Feed-Forward Network
- Layer Normalization
- Positional Encoding

## 관련 페이지

- [[attention]]
- [[attention-is-all-you-need]]
