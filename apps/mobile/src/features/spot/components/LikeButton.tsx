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
    setLiked((prev) => !prev);
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
