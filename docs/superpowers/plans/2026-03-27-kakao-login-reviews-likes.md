# Kakao Login + Reviews + Likes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카카오 소셜 로그인을 추가하고, 좋아요(로그인 불필요·로컬 저장), 후기(로그인 필요·Supabase 저장) 기능을 명소 상세 화면에 구현한다.

**Architecture:**
- 좋아요: `@react-native-async-storage/async-storage`로 기기 로컬 저장 (로그인 불필요)
- 인증: Supabase Auth + Kakao OAuth, `expo-web-browser`로 브라우저 열어 처리, 딥링크(`kkoteodi://auth/callback`)로 복귀
- 후기: Supabase `spot_reviews` 테이블, RLS로 인증 사용자만 작성, 전체 공개 읽기

**Tech Stack:** Supabase Auth (Kakao OAuth), expo-web-browser, expo-linking, AsyncStorage, TanStack Query

---

## 사전 외부 설정 (코드 작업 전 수동 필요)

### A. 카카오 디벨로퍼 콘솔
1. https://developers.kakao.com 접속 → 애플리케이션 생성
2. **앱 키** → REST API 키, JavaScript 키 메모
3. **플랫폼** → Web 플랫폼 추가, 사이트 도메인: `http://localhost:8081` (개발용)
4. **카카오 로그인** 활성화
5. **Redirect URI** 추가: Supabase 대시보드에서 확인할 URL (아래 B에서 확인)

### B. Supabase 대시보드
1. Authentication → Providers → Kakao 활성화
2. Client ID = 카카오 REST API 키
3. Client Secret = 카카오 앱의 Client Secret (카카오 보안 탭에서 활성화 후 생성)
4. **Redirect URL** 복사 → 카카오 콘솔 Redirect URI에 붙여넣기
5. 복사한 Redirect URL을 `.env.local`에 메모해둘 것

---

## Chunk 1: Database Schema

**Files:**
- SQL 직접 실행 (Supabase SQL Editor)

- [ ] **Step 1: spot_reviews 테이블 생성**

Supabase SQL Editor에서 실행:

```sql
CREATE TABLE spot_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  spot_id uuid NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) >= 5 AND char_length(content) <= 300),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX spot_reviews_spot_id_idx ON spot_reviews(spot_id);
CREATE INDEX spot_reviews_created_at_idx ON spot_reviews(created_at DESC);
```

- [ ] **Step 2: RLS 정책 설정**

```sql
ALTER TABLE spot_reviews ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능
CREATE POLICY "anyone can read reviews"
  ON spot_reviews FOR SELECT
  USING (true);

-- 로그인 사용자만 본인 후기 작성
CREATE POLICY "authenticated users can insert own reviews"
  ON spot_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 본인 후기만 삭제
CREATE POLICY "users can delete own reviews"
  ON spot_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

- [ ] **Step 3: 결과 확인**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_name = 'spot_reviews';
-- spot_reviews 행이 나와야 함

SELECT policyname FROM pg_policies WHERE tablename = 'spot_reviews';
-- 3개 정책이 나와야 함
```

---

## Chunk 2: 좋아요 기능 (로그인 불필요, 로컬)

**Files:**
- Install: `@react-native-async-storage/async-storage`
- Create: `apps/mobile/src/shared/data/likeRepository.ts`
- Create: `apps/mobile/src/features/spot/components/LikeButton.tsx`
- Modify: `apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx`

- [ ] **Step 1: AsyncStorage 설치**

```bash
cd apps/mobile
pnpm add @react-native-async-storage/async-storage
```

- [ ] **Step 2: likeRepository.ts 작성**

`apps/mobile/src/shared/data/likeRepository.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIKES_KEY = 'spot_likes_v1';

async function getLikedIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(LIKES_KEY);
  const arr: string[] = raw ? JSON.parse(raw) : [];
  return new Set(arr);
}

async function saveLikedIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(LIKES_KEY, JSON.stringify([...ids]));
}

export async function isSpotLiked(spotId: string): Promise<boolean> {
  const ids = await getLikedIds();
  return ids.has(spotId);
}

export async function toggleSpotLike(spotId: string): Promise<boolean> {
  const ids = await getLikedIds();
  if (ids.has(spotId)) {
    ids.delete(spotId);
  } else {
    ids.add(spotId);
  }
  await saveLikedIds(ids);
  return ids.has(spotId);
}

export async function getAllLikedIds(): Promise<string[]> {
  const ids = await getLikedIds();
  return [...ids];
}
```

- [ ] **Step 3: LikeButton.tsx 작성**

`apps/mobile/src/features/spot/components/LikeButton.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { isSpotLiked, toggleSpotLike } from '../../../shared/data/likeRepository';
import { colors } from '../../../shared/theme/colors';

type LikeButtonProps = {
  spotId: string;
};

export function LikeButton({ spotId }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isSpotLiked(spotId).then((v) => {
      setLiked(v);
      setLoading(false);
    });
  }, [spotId]);

  async function handlePress() {
    setLiked((prev) => !prev); // 즉시 낙관적 업데이트
    await toggleSpotLike(spotId);
  }

  if (loading) return null;

  return (
    <Pressable onPress={handlePress} style={[styles.button, liked && styles.buttonLiked]}>
      <Text style={[styles.text, liked && styles.textLiked]}>
        {liked ? '♥ 저장됨' : '♡ 저장하기'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonLiked: {
    backgroundColor: colors.softPink,
    borderColor: colors.secondary,
  },
  text: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  textLiked: {
    color: colors.secondaryDeep,
  },
});
```

- [ ] **Step 4: SpotDetailScreen에 LikeButton 추가**

`apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx` 상단 import에 추가:
```typescript
import { LikeButton } from '../components/LikeButton';
```

`<SpotHeroCard ... />` 바로 아래에 추가:
```tsx
<LikeButton spotId={spot.id} />
```

- [ ] **Step 5: 동작 확인**

앱 실행 → 명소 상세 → "♡ 저장하기" 탭 → "♥ 저장됨"으로 변경되는지 확인
앱 재시작 → 같은 명소 상세 → 여전히 "♥ 저장됨" 상태인지 확인 (AsyncStorage 지속성 확인)

- [ ] **Step 6: 커밋**

```bash
git add apps/mobile/src/shared/data/likeRepository.ts \
        apps/mobile/src/features/spot/components/LikeButton.tsx \
        apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx \
        apps/mobile/pnpm-lock.yaml apps/mobile/package.json
git commit -m "feat(mobile): 좋아요 기능 추가 (AsyncStorage 로컬 저장)"
```

---

## Chunk 3: 카카오 로그인

**Files:**
- Modify: `apps/mobile/app.json` — scheme 추가
- Modify: `apps/mobile/src/shared/lib/supabase.ts` — auth 설정 활성화
- Create: `apps/mobile/src/shared/context/AuthContext.tsx`
- Create: `apps/mobile/src/shared/hooks/useAuth.ts`
- Create: `apps/mobile/app/auth/callback.tsx` — 딥링크 콜백 처리
- Modify: `apps/mobile/app/_layout.tsx` — AuthProvider 추가
- Modify: `apps/mobile/src/features/me/screens/MeScreen.tsx` — 로그인 UI

- [ ] **Step 1: expo-web-browser, expo-linking 설치**

```bash
cd apps/mobile
pnpm add expo-web-browser expo-linking
```

- [ ] **Step 2: app.json에 scheme 추가**

`apps/mobile/app.json`의 `expo` 객체에 추가:
```json
{
  "expo": {
    "scheme": "kkoteodi",
    ...
  }
}
```

- [ ] **Step 3: supabase.ts auth 설정 활성화**

`apps/mobile/src/shared/lib/supabase.ts` 수정:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: Platform.OS !== 'web' ? AsyncStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
```

- [ ] **Step 4: AuthContext.tsx 작성**

`apps/mobile/src/shared/context/AuthContext.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 5: auth/callback.tsx 작성 (딥링크 콜백)**

`apps/mobile/app/auth/callback.tsx`:

```tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../../src/shared/lib/supabase';

export default function AuthCallbackRoute() {
  const router = useRouter();

  useEffect(() => {
    const url = Linking.getLinkingURL();
    if (url) {
      handleDeepLink(url);
    }

    const sub = Linking.addEventListener('url', (event) => handleDeepLink(event.url));
    return () => sub.remove();
  }, []);

  async function handleDeepLink(url: string) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(url);
    if (!error && data.session) {
      router.replace('/');
    }
  }

  return (
    <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
      <Text>로그인 처리 중...</Text>
    </View>
  );
}
```

- [ ] **Step 6: _layout.tsx에 AuthProvider 추가**

`apps/mobile/app/_layout.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/shared/context/AuthContext';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="spot/[slug]" />
          <Stack.Screen name="list" />
          <Stack.Screen name="filters" />
          <Stack.Screen name="auth/callback" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 7: 카카오 로그인 함수 작성**

`apps/mobile/src/shared/lib/auth.ts`:

```typescript
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithKakao(): Promise<void> {
  const redirectTo = Platform.OS === 'web'
    ? window.location.origin + '/auth/callback'
    : Linking.createURL('/auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
    },
  });

  if (error) throw error;

  if (Platform.OS !== 'web' && data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success') {
      await supabase.auth.exchangeCodeForSession(result.url);
    }
  }
}
```

- [ ] **Step 8: MeScreen 로그인 UI 구현**

`apps/mobile/src/features/me/screens/MeScreen.tsx` 수정:

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../shared/context/AuthContext';
import { signInWithKakao } from '../../../shared/lib/auth';
import { colors } from '../../../shared/theme/colors';
import { ScreenShell } from '../../../shared/ui/ScreenShell';

export function MeScreen() {
  const { user, signOut, isLoading } = useAuth();

  if (isLoading) {
    return (
      <ScreenShell title="내 정보">
        <View />
      </ScreenShell>
    );
  }

  if (!user) {
    return (
      <ScreenShell title="내 정보" subtitle="로그인하면 후기를 남길 수 있어요.">
        <Pressable onPress={signInWithKakao} style={styles.kakaoButton}>
          <Text style={styles.kakaoButtonText}>카카오로 로그인</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="내 정보" subtitle={user.email ?? '카카오 로그인됨'}>
      <Pressable onPress={signOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>로그아웃</Text>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  kakaoButton: {
    alignItems: 'center',
    backgroundColor: '#FEE500',
    borderRadius: 12,
    paddingVertical: 16,
  },
  kakaoButtonText: {
    color: '#191919',
    fontSize: 16,
    fontWeight: '700',
  },
  signOutButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  signOutText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
```

- [ ] **Step 9: 로그인 동작 확인**

앱 실행 → 하단 탭 "내 정보" → "카카오로 로그인" 버튼 탭
→ 카카오 로그인 창 열림 → 로그인 완료 → 앱으로 복귀 → 이메일이 표시되는지 확인

- [ ] **Step 10: 커밋**

```bash
git add apps/mobile/app.json \
        apps/mobile/src/shared/lib/supabase.ts \
        apps/mobile/src/shared/lib/auth.ts \
        apps/mobile/src/shared/context/AuthContext.tsx \
        apps/mobile/app/auth/callback.tsx \
        apps/mobile/app/_layout.tsx \
        apps/mobile/src/features/me/screens/MeScreen.tsx \
        apps/mobile/package.json apps/mobile/pnpm-lock.yaml
git commit -m "feat(mobile): 카카오 소셜 로그인 구현 (Supabase Auth)"
```

---

## Chunk 4: 후기 기능

**Files:**
- Create: `apps/mobile/src/shared/data/reviewRepository.ts`
- Create: `apps/mobile/src/features/spot/components/ReviewSection.tsx`
- Modify: `apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx`

- [ ] **Step 1: reviewRepository.ts 작성**

`apps/mobile/src/shared/data/reviewRepository.ts`:

```typescript
import { supabase } from '../lib/supabase';

export type Review = {
  id: string;
  spotId: string;
  userId: string;
  content: string;
  createdAt: string;
};

type ReviewRow = {
  id: string;
  spot_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    spotId: row.spot_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
  };
}

export const reviewKeys = {
  bySpot: (spotId: string) => ['reviews', spotId] as const,
};

export async function getReviewsBySpotId(spotId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('spot_reviews')
    .select('*')
    .eq('spot_id', spotId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => toReview(row as ReviewRow));
}

export async function createReview(spotId: string, userId: string, content: string): Promise<Review> {
  const { data, error } = await supabase
    .from('spot_reviews')
    .insert({ spot_id: spotId, user_id: userId, content })
    .select()
    .single();

  if (error) throw error;
  return toReview(data as ReviewRow);
}

export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase
    .from('spot_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
}
```

- [ ] **Step 2: ReviewSection.tsx 작성**

`apps/mobile/src/features/spot/components/ReviewSection.tsx`:

```tsx
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../../shared/context/AuthContext';
import {
  createReview,
  deleteReview,
  getReviewsBySpotId,
  reviewKeys,
} from '../../../shared/data/reviewRepository';
import { colors } from '../../../shared/theme/colors';

type ReviewSectionProps = {
  spotId: string;
};

const REVIEW_ITEM_HEIGHT = 72; // 아이템 하나 높이 (패딩 포함)
const VISIBLE_COUNT = 5.5;
const SECTION_HEIGHT = REVIEW_ITEM_HEIGHT * VISIBLE_COUNT;

export function ReviewSection({ spotId }: ReviewSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: reviewKeys.bySpot(spotId),
    queryFn: () => getReviewsBySpotId(spotId),
  });

  const createMutation = useMutation({
    mutationFn: (content: string) => createReview(spotId, user!.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.bySpot(spotId) });
      setInput('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.bySpot(spotId) });
    },
  });

  function handleSubmit() {
    const trimmed = input.trim();
    if (trimmed.length < 5) return;
    createMutation.mutate(trimmed);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>방문 후기</Text>
      <Text style={styles.count}>{reviews.length}개</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : reviews.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 후기가 없어요. 첫 번째 후기를 남겨보세요!</Text>
        </View>
      ) : (
        <ScrollView
          nestedScrollEnabled
          style={styles.reviewList}
          showsVerticalScrollIndicator={false}
        >
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <Text style={styles.reviewContent}>{review.content}</Text>
              <View style={styles.reviewMeta}>
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                </Text>
                {user?.id === review.userId && (
                  <Pressable
                    onPress={() => deleteMutation.mutate(review.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteText}>삭제</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {user ? (
        <View style={styles.inputRow}>
          <TextInput
            multiline
            maxLength={300}
            onChangeText={setInput}
            placeholder="방문 후기를 남겨주세요 (5자 이상)"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={input}
          />
          <Pressable
            disabled={input.trim().length < 5 || createMutation.isPending}
            onPress={handleSubmit}
            style={[styles.submitButton, input.trim().length < 5 && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitText}>등록</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>
            후기를 작성하려면 로그인이 필요해요
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    padding: 16,
  },
  count: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
    marginTop: 2,
  },
  deleteButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  deleteText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    height: REVIEW_ITEM_HEIGHT * 2,
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputRow: {
    alignItems: 'flex-end',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
  },
  loader: {
    height: REVIEW_ITEM_HEIGHT * 2,
  },
  loginPrompt: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  loginPromptText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  reviewContent: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  reviewDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  reviewItem: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    minHeight: REVIEW_ITEM_HEIGHT,
    paddingVertical: 12,
  },
  reviewList: {
    height: SECTION_HEIGHT,
    marginBottom: 4,
  },
  reviewMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
});
```

- [ ] **Step 3: SpotDetailScreen에 ReviewSection 추가**

`apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx`:

import 추가:
```typescript
import { ReviewSection } from '../components/ReviewSection';
```

`<SectionCard title="운영 팁">...</SectionCard>` 바로 아래에 추가:
```tsx
<ReviewSection spotId={spot.id} />
```

- [ ] **Step 4: spot_reviews RLS에 anon SELECT 확인**

Supabase SQL Editor에서 확인:
```sql
-- anon 역할도 읽기 가능한지 확인 (Chunk 1에서 USING (true) 설정했으므로 OK)
SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'spot_reviews';
```

- [ ] **Step 5: 동작 확인**

1. 비로그인 상태: 명소 상세 → "운영 팁" 아래 후기 섹션 표시, "로그인이 필요해요" 메시지
2. 카카오 로그인 → 명소 상세 → 입력창 표시
3. 후기 5자 이상 입력 → "등록" 버튼 활성화 → 등록 → 목록에 바로 반영
4. 본인 후기에만 "삭제" 버튼 보이는지 확인
5. 6개 이상 후기 시 고정 높이 내부 스크롤 동작 확인

- [ ] **Step 6: 커밋**

```bash
git add apps/mobile/src/shared/data/reviewRepository.ts \
        apps/mobile/src/features/spot/components/ReviewSection.tsx \
        apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx
git commit -m "feat(mobile): 명소 후기 기능 추가 (Supabase, 로그인 필요)"
```

---

## 완료 후 확인 체크리스트

- [ ] 비로그인: 좋아요 토글 가능, 앱 재시작 후에도 유지
- [ ] 비로그인: 후기 목록 조회 가능, 입력창 대신 로그인 안내 표시
- [ ] 카카오 로그인 → MeScreen에 이메일 표시
- [ ] 로그인 후: 후기 작성 및 본인 후기 삭제 가능
- [ ] 후기 5개 초과 시 고정 높이 내 스크롤 동작
- [ ] 로그아웃 → 다시 로그인 안내 상태로 복귀
