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

const REVIEW_ITEM_HEIGHT = 72;
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
          showsVerticalScrollIndicator={false}
          style={styles.reviewList}
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
          <Text style={styles.loginPromptText}>후기를 작성하려면 로그인이 필요해요</Text>
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
