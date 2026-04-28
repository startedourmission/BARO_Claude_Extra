---
title: 어텐션 메커니즘 (Attention Mechanism)
type: concept
created: 2026-04-28
updated: 2026-04-28
sources: [attention-is-all-you-need.md]
---

# 어텐션 메커니즘

Query, Key, Value 세 행렬의 내적으로 각 토큰이 다른 토큰을 얼마나 "주목"할지 계산.

## Scaled Dot-Product Attention

```
Attention(Q, K, V) = softmax(QK^T / √d_k) V
```

`√d_k`로 나누는 이유: d_k가 클수록 내적 값이 커져 softmax 기울기가 소실되는 현상 방지.

## Multi-Head Attention

동일한 Attention을 h번 병렬로 수행해 다양한 표현 부공간을 동시에 학습.

## 관련 페이지

- [[transformer]]
- [[attention-is-all-you-need]]
