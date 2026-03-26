# Expo 라우팅 구조 초안

공식 Expo Router 문서 기준으로 `app` 디렉터리 아래 파일 기반 라우팅을 사용한다.

참고:

- [File-based routing](https://docs.expo.dev/develop/file-based-routing)
- [JavaScript tabs](https://docs.expo.dev/router/advanced/tabs/)
- [Stack](https://docs.expo.dev/router/advanced/stack/)

## 추천 구조

```text
app/
  _layout.tsx
  +not-found.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    map.tsx
    saved.tsx
    me.tsx
  list.tsx
  filters.tsx
  spot/
    [id].tsx
src/
  features/
    home/
    map/
    saved/
    me/
    spot/
  shared/
    theme/
    ui/
```

## 라우팅 원칙

- 하단 탭은 `홈`, `지도`, `저장`, `내 정보` 4개를 사용한다.
- 상세 화면은 탭 밖의 스택으로 push 한다.
- 필터는 초기에는 일반 화면으로 두고, 이후 바텀시트 라이브러리 도입 시 모달로 전환한다.
- 리스트 화면은 지도와 같은 필터 상태를 공유한다.

## 화면 매핑

- `/` -> 홈
- `/map` -> 지도 탐색
- `/saved` -> 즐겨찾기
- `/me` -> 내 정보
- `/list` -> 명소 리스트
- `/filters` -> 필터
- `/spot/[id]` -> 명소 상세

## 구현 순서

1. 루트 스택
2. 탭 레이아웃
3. 홈 화면
4. 지도 화면
5. 상세 화면
