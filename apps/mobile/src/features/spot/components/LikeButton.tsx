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
