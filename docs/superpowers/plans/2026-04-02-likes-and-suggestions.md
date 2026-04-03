# 좋아요 & 명소 추천 기능 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 저장하기를 서버 기반 좋아요로 전환하고, 사용자가 명소를 추천할 수 있는 기능을 추가한다.

**Architecture:** Supabase에 `spot_likes`, `spot_suggestions` 테이블을 추가하고, 모바일 앱의 likeRepository를 서버 기반으로 전환한다. 어드민에는 추천 접수 조회 페이지를 추가한다. 디바이스 식별은 AsyncStorage에 UUID를 영구 저장하는 방식을 사용한다.

**Tech Stack:** Supabase (PostgreSQL + RLS), React Native (Expo), React Query, Next.js (Admin)

---

## Chunk 1: DB 마이그레이션

### Task 1: spot_likes 테이블 마이그레이션

**Files:**
- Create: `supabase/migrations/20260402_spot_likes.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
CREATE TABLE spot_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id    uuid NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  device_id  text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (spot_id, device_id)
);

ALTER TABLE spot_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spot_likes_select"
ON spot_likes FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "spot_likes_insert"
ON spot_likes FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "spot_likes_delete"
ON spot_likes FOR DELETE TO anon, authenticated
USING (true);

CREATE INDEX idx_spot_likes_spot_id ON spot_likes(spot_id);
CREATE INDEX idx_spot_likes_device_id ON spot_likes(device_id);
```

- [ ] **Step 2: 커밋**

```bash
git add supabase/migrations/20260402_spot_likes.sql
git commit -m "feat(db): spot_likes 테이블 마이그레이션 추가"
```

### Task 2: spot_suggestions 테이블 마이그레이션

**Files:**
- Create: `supabase/migrations/20260402_spot_suggestions.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
CREATE TABLE spot_suggestions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  address     text,
  description text,
  device_id   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE spot_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spot_suggestions_insert"
ON spot_suggestions FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "spot_suggestions_admin_select"
ON spot_suggestions FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
```

- [ ] **Step 2: 커밋**

```bash
git add supabase/migrations/20260402_spot_suggestions.sql
git commit -m "feat(db): spot_suggestions 테이블 마이그레이션 추가"
```

---

## Chunk 2: 모바일 - 디바이스 ID & 좋아요 Repository

### Task 3: 디바이스 ID 유틸리티

**Files:**
- Create: `apps/mobile/src/shared/lib/deviceId.ts`

- [ ] **Step 1: deviceId 모듈 작성**

AsyncStorage에 UUID를 한번 생성하여 영구 저장한다. 키: `device_id_v1`.

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

const DEVICE_ID_KEY = 'device_id_v1';

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;

  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    cached = stored;
    return stored;
  }

  const id = randomUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  cached = id;
  return id;
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/mobile/src/shared/lib/deviceId.ts
git commit -m "feat(mobile): 디바이스 ID 유틸리티 추가"
```

### Task 4: likeRepository를 Supabase 기반으로 전환

**Files:**
- Modify: `apps/mobile/src/shared/data/likeRepository.ts` (전체 재작성)

- [ ] **Step 1: likeRepository 재작성**

기존 AsyncStorage 기반 → Supabase `spot_likes` 테이블 기반으로 전환한다.

```typescript
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';

export async function isSpotLiked(spotId: string): Promise<boolean> {
  const deviceId = await getDeviceId();
  const { count } = await supabase
    .from('spot_likes')
    .select('*', { count: 'exact', head: true })
    .eq('spot_id', spotId)
    .eq('device_id', deviceId);
  return (count ?? 0) > 0;
}

export async function toggleSpotLike(spotId: string): Promise<boolean> {
  const deviceId = await getDeviceId();
  const liked = await isSpotLiked(spotId);

  if (liked) {
    await supabase
      .from('spot_likes')
      .delete()
      .eq('spot_id', spotId)
      .eq('device_id', deviceId);
    return false;
  }

  await supabase
    .from('spot_likes')
    .insert({ spot_id: spotId, device_id: deviceId });
  return true;
}

export async function getSpotLikeCount(spotId: string): Promise<number> {
  const { count } = await supabase
    .from('spot_likes')
    .select('*', { count: 'exact', head: true })
    .eq('spot_id', spotId);
  return count ?? 0;
}

export async function getAllLikedIds(): Promise<string[]> {
  const deviceId = await getDeviceId();
  const { data } = await supabase
    .from('spot_likes')
    .select('spot_id')
    .eq('device_id', deviceId);
  return (data ?? []).map((row) => row.spot_id);
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/mobile/src/shared/data/likeRepository.ts
git commit -m "feat(mobile): likeRepository를 Supabase 기반으로 전환"
```

---

## Chunk 3: 모바일 - LikeButton UI 변경

### Task 5: LikeButton에 좋아요 수 표시

**Files:**
- Modify: `apps/mobile/src/features/spot/components/LikeButton.tsx` (전체 재작성)

- [ ] **Step 1: LikeButton 재작성**

"저장하기/저장됨" → 하트 아이콘 + 좋아요 수 표시로 변경한다.

```typescript
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { isSpotLiked, toggleSpotLike, getSpotLikeCount } from '../../../shared/data/likeRepository';
import { colors } from '../../../shared/theme/colors';

type LikeButtonProps = {
  spotId: string;
};

export function LikeButton({ spotId }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([isSpotLiked(spotId), getSpotLikeCount(spotId)]).then(
      ([isLiked, likeCount]) => {
        setLiked(isLiked);
        setCount(likeCount);
        setLoading(false);
      },
    );
  }, [spotId]);

  async function handlePress() {
    const willLike = !liked;
    setLiked(willLike);
    setCount((prev) => prev + (willLike ? 1 : -1));
    await toggleSpotLike(spotId);
  }

  if (loading) return null;

  return (
    <Pressable onPress={handlePress} style={[styles.button, liked && styles.buttonLiked]}>
      <Text style={[styles.text, liked && styles.textLiked]}>
        {liked ? '♥' : '♡'} 좋아요 {count > 0 ? count : ''}
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

- [ ] **Step 2: 커밋**

```bash
git add apps/mobile/src/features/spot/components/LikeButton.tsx
git commit -m "feat(mobile): LikeButton 좋아요 수 표시 및 텍스트 변경"
```

---

## Chunk 4: 모바일 - SavedScreen 업데이트 & 명소 추천

### Task 6: SavedScreen 타이틀 변경

**Files:**
- Modify: `apps/mobile/src/features/saved/screens/SavedScreen.tsx`

- [ ] **Step 1: 텍스트 변경**

SavedScreen에서 "저장한 명소" → "좋아요한 명소", 안내 텍스트도 업데이트한다.

변경할 부분:
- Line 44: `title="저장한 명소"` → `title="좋아요한 명소"`
- Line 45: `subtitle=` → `subtitle="내가 좋아요 누른 꽃 명소를 모아봤어요."`
- Line 61: `<SectionCard title="저장 목록">` → `<SectionCard title="좋아요 목록">`
- Line 65: `'저장한 명소가 없어요. 명소 상세에서 ♡ 버튼을 눌러보세요.'` → `'좋아요한 명소가 없어요. 명소 상세에서 ♡ 버튼을 눌러보세요.'`
- Line 66: ``'${activeFilter}' 조건에 맞는 저장 명소가 없어요.`` → ``'${activeFilter}' 조건에 맞는 명소가 없어요.``

- [ ] **Step 2: 커밋**

```bash
git add apps/mobile/src/features/saved/screens/SavedScreen.tsx
git commit -m "feat(mobile): SavedScreen 텍스트를 좋아요로 변경"
```

### Task 7: 명소 추천 Repository

**Files:**
- Create: `apps/mobile/src/shared/data/suggestionRepository.ts`

- [ ] **Step 1: suggestionRepository 작성**

```typescript
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';

type SpotSuggestion = {
  name: string;
  address?: string;
  description?: string;
};

export async function submitSpotSuggestion(suggestion: SpotSuggestion): Promise<void> {
  const deviceId = await getDeviceId();
  const { error } = await supabase.from('spot_suggestions').insert({
    name: suggestion.name,
    address: suggestion.address || null,
    description: suggestion.description || null,
    device_id: deviceId,
  });
  if (error) throw error;
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/mobile/src/shared/data/suggestionRepository.ts
git commit -m "feat(mobile): 명소 추천 제출 repository 추가"
```

### Task 8: 명소 추천 바텀시트 컴포넌트

**Files:**
- Create: `apps/mobile/src/features/saved/components/SuggestSpotSheet.tsx`

- [ ] **Step 1: SuggestSpotSheet 작성**

SavedScreen 하단에 배치될 추천 카드와 바텀시트 폼이다. 모달 대신 인라인 확장 방식으로 구현한다.

```typescript
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { submitSpotSuggestion } from '../../../shared/data/suggestionRepository';
import { colors } from '../../../shared/theme/colors';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function SuggestSpotSheet() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await submitSpotSuggestion({
        name: name.trim(),
        address: address.trim() || undefined,
        description: description.trim() || undefined,
      });
      setName('');
      setAddress('');
      setDescription('');
      setOpen(false);
      Alert.alert('감사합니다!', '추천해 주신 명소를 검토할게요.');
    } catch {
      Alert.alert('오류', '제출 중 문제가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <SectionCard title="명소 추천">
        <Text style={styles.promptText}>알고 계신 꽃 명소가 있나요?</Text>
        <Pressable onPress={() => setOpen(true)} style={styles.openButton}>
          <Text style={styles.openButtonText}>명소 추천하기</Text>
        </Pressable>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="명소 추천하기">
      <View style={styles.field}>
        <Text style={styles.label}>명소 이름 *</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 여의도 한강공원"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>위치 / 주소 (선택)</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 서울 영등포구"
          placeholderTextColor={colors.textMuted}
          value={address}
          onChangeText={setAddress}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>추천 이유 (선택)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="어떤 점이 좋았는지 알려주세요"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => setOpen(false)} style={styles.cancelButton}>
          <Text style={styles.cancelText}>취소</Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting || !name.trim()}
          style={[styles.submitButton, (!name.trim() || submitting) && styles.submitDisabled]}
        >
          <Text style={styles.submitText}>{submitting ? '제출 중...' : '추천하기'}</Text>
        </Pressable>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  cancelButton: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  field: {
    marginBottom: 12,
  },
  input: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  openButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 999,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  promptText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: 커밋**

```bash
git add apps/mobile/src/features/saved/components/SuggestSpotSheet.tsx
git commit -m "feat(mobile): 명소 추천 폼 컴포넌트 추가"
```

### Task 9: SavedScreen에 명소 추천 카드 통합

**Files:**
- Modify: `apps/mobile/src/features/saved/screens/SavedScreen.tsx`

- [ ] **Step 1: SuggestSpotSheet import 및 배치**

SavedScreen에서 `<NativeSpotAd />` 바로 위에 `<SuggestSpotSheet />`를 추가한다.

변경할 부분:
- import 추가: `import { SuggestSpotSheet } from '../components/SuggestSpotSheet';`
- Line 106 `<NativeSpotAd />` 위에 `<SuggestSpotSheet />` 삽입

- [ ] **Step 2: 커밋**

```bash
git add apps/mobile/src/features/saved/screens/SavedScreen.tsx
git commit -m "feat(mobile): SavedScreen에 명소 추천 카드 추가"
```

---

## Chunk 5: 어드민 - 추천 접수 페이지

### Task 10: 어드민 추천 접수 데이터 조회

**Files:**
- Create: `apps/admin/src/lib/data/suggestions.ts`

- [ ] **Step 1: suggestions 데이터 레이어 작성**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/types';

export type SuggestionRow = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  device_id: string;
  created_at: string;
};

export async function listSuggestions(client: SupabaseClient<Database>): Promise<SuggestionRow[]> {
  const { data, error } = await (client.from('spot_suggestions') as any)
    .select('*')
    .order('created_at', { ascending: false });

  if (error != null) throw error;
  return (data ?? []) as SuggestionRow[];
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/admin/src/lib/data/suggestions.ts
git commit -m "feat(admin): 추천 접수 데이터 조회 함수 추가"
```

### Task 11: 어드민 추천 접수 페이지

**Files:**
- Create: `apps/admin/app/(dashboard)/suggestions/page.tsx`

- [ ] **Step 1: 추천 접수 목록 페이지 작성**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { listSuggestions } from '@/lib/data/suggestions';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types';

export default async function SuggestionsPage() {
  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;
  const suggestions = await listSuggestions(client);

  return (
    <DashboardShell title="추천 접수" description="사용자가 추천한 명소 목록입니다.">
      <Card className="overflow-hidden">
        <CardHeader className="px-5 py-5">
          <CardTitle>접수 목록 ({suggestions.length}건)</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {suggestions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">접수된 추천이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">명소 이름</th>
                    <th className="pb-3 pr-4 font-medium">위치</th>
                    <th className="pb-3 pr-4 font-medium">추천 이유</th>
                    <th className="pb-3 font-medium">접수일</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((s) => (
                    <tr key={s.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-foreground">{s.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{s.address ?? '-'}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{s.description ?? '-'}</td>
                      <td className="py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/admin/app/\(dashboard\)/suggestions/page.tsx
git commit -m "feat(admin): 추천 접수 목록 페이지 추가"
```

### Task 12: 어드민 사이드바에 추천 접수 메뉴 추가

**Files:**
- Modify: `apps/admin/src/features/dashboard/AdminSidebar.tsx:6-13`

- [ ] **Step 1: 메뉴 항목 추가**

`primaryNavItems` 배열에 추천 접수 항목을 추가한다. `JSON 등록` 아래에 배치.

```typescript
const primaryNavItems = [
  { href: '/', label: '대시보드' },
  { href: '/flowers', label: '꽃 관리' },
  { href: '/spots', label: '명소 관리' },
  { href: '/spots/import', label: 'JSON 등록' },
  { href: '/suggestions', label: '추천 접수' },
  { href: '/notifications', label: '알림 발송' },
  { href: '/settings', label: '설정' },
];
```

- [ ] **Step 2: 커밋**

```bash
git add apps/admin/src/features/dashboard/AdminSidebar.tsx
git commit -m "feat(admin): 사이드바에 추천 접수 메뉴 추가"
```

---

## 최종 커밋 순서 요약

1. `feat(db): spot_likes 테이블 마이그레이션 추가`
2. `feat(db): spot_suggestions 테이블 마이그레이션 추가`
3. `feat(mobile): 디바이스 ID 유틸리티 추가`
4. `feat(mobile): likeRepository를 Supabase 기반으로 전환`
5. `feat(mobile): LikeButton 좋아요 수 표시 및 텍스트 변경`
6. `feat(mobile): SavedScreen 텍스트를 좋아요로 변경`
7. `feat(mobile): 명소 추천 제출 repository 추가`
8. `feat(mobile): 명소 추천 폼 컴포넌트 추가`
9. `feat(mobile): SavedScreen에 명소 추천 카드 추가`
10. `feat(admin): 추천 접수 데이터 조회 함수 추가`
11. `feat(admin): 추천 접수 목록 페이지 추가`
12. `feat(admin): 사이드바에 추천 접수 메뉴 추가`
