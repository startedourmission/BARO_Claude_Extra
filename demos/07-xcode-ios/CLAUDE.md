# iOS 앱 개발 규약

## 프로젝트 개요

- 타깃: iOS 18+
- 언어: Swift 6 (strict concurrency 활성)
- UI: SwiftUI 우선, UIKit은 불가피한 경우에만
- 상태: @Observable / Observation 프레임워크 우선

## 파일 구조

- `Sources/Features/` — 기능 단위 (View + ViewModel + Model)
- `Sources/Shared/` — 공통 유틸·뷰 컴포넌트
- `Tests/` — Swift Testing 기반 유닛 테스트

## 코딩 규칙

- 강제 언래핑 금지. guard let / if let 우선
- UI 문자열은 String Catalog(`Localizable.xcstrings`)로
- SwiftUI와 UIKit 혼용 금지

## 빌드·테스트

- 빌드: `xcode build` MCP 툴 사용
- 테스트: `xcode test --simulator "iPhone 16 Pro"`
- 실기기 빌드는 요청 시에만 (프로비저닝은 사람이 챙긴다)

## 커밋

- 메시지 한국어
- 이모지 프리픽스 금지
