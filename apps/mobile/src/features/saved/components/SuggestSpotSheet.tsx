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
