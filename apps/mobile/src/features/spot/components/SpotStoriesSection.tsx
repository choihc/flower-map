import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getSpotContent, spotKeys } from '../../../shared/data/spotRepository';
import type { SpotBlog, SpotVideo } from '../../../shared/data/types';
import { colors } from '../../../shared/theme/colors';

type SpotStoriesSectionProps = {
  slug: string;
};

function formatKoreanDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

/**
 * 외부 링크를 열기 전 스킴을 화이트리스트 검증한다.
 * `javascript:`, `file:` 등 악의적 스킴으로 임의 코드를 실행하는 것을 방지한다.
 */
function openExternalLink(url: string) {
  if (!/^https?:\/\//i.test(url)) {
    console.warn('차단된 URL 스킴:', url);
    return;
  }
  Linking.openURL(url).catch((err) => console.warn('openURL 실패', err));
}

export function SpotStoriesSection({ slug }: SpotStoriesSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: spotKeys.content(slug),
    queryFn: () => getSpotContent(slug),
  });

  if (isLoading) return null;

  const videos = data?.videos ?? [];
  const blogs = data?.blogs ?? [];

  if (videos.length === 0 && blogs.length === 0) {
    return null;
  }

  return (
    <View testID="spot-stories-section" style={styles.section}>
      <Text style={styles.title}>이 명소 이야기</Text>

      {videos.length > 0 && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>영상</Text>
          <View style={styles.videoList}>
            {videos.map((video) => (
              <VideoCard key={video.videoId} video={video} />
            ))}
          </View>
        </View>
      )}

      {blogs.length > 0 && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>블로그 리뷰</Text>
          <View style={styles.blogList}>
            {blogs.map((blog) => (
              <BlogRow key={blog.url} blog={blog} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function VideoCard({ video }: { video: SpotVideo }) {
  return (
    <Pressable
      testID="story-video"
      onPress={() => {
        openExternalLink(`https://youtu.be/${video.videoId}`);
      }}
      style={styles.videoCard}
    >
      <Image source={{ uri: video.thumbnailUrl }} style={styles.videoThumbnail} />
      <Text numberOfLines={2} style={styles.videoTitle}>
        {video.title}
      </Text>
      <Text numberOfLines={1} style={styles.videoChannel}>
        {video.channelTitle}
      </Text>
    </Pressable>
  );
}

function BlogRow({ blog }: { blog: SpotBlog }) {
  return (
    <Pressable
      testID="story-blog"
      onPress={() => {
        openExternalLink(blog.url);
      }}
      style={styles.blogRow}
    >
      <Text numberOfLines={2} style={styles.blogTitle}>
        {blog.title}
      </Text>
      <Text style={styles.blogMeta}>
        {blog.bloggerName} · {formatKoreanDate(blog.postedAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  blogList: {
    gap: 6,
  },
  blogMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  blogRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  blogTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 22,
    padding: 18,
  },
  subsection: {
    marginTop: 12,
  },
  subsectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  videoCard: {
    gap: 4,
    width: 160,
  },
  videoChannel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  videoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  videoThumbnail: {
    borderRadius: 10,
    height: 90,
    width: '100%',
  },
  videoTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
