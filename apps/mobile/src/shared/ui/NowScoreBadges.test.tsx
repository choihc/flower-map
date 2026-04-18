import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';

import { NowScoreBadges } from './NowScoreBadges';

describe('NowScoreBadges', () => {
  it('bloomScore >= 80이면 bloom-peak 배지가 렌더된다', () => {
    const { getByTestId, queryByTestId } = render(
      <NowScoreBadges bloomScore={85} />,
    );

    expect(getByTestId('now-score-badge-bloom-peak')).toBeTruthy();
    expect(queryByTestId('now-score-badge-trending')).toBeNull();
    expect(queryByTestId('now-score-badge-yoy-rising')).toBeNull();
  });

  it('세 점수 모두 임계값을 넘으면 3개 배지가 모두 렌더된다', () => {
    const { getByTestId } = render(
      <NowScoreBadges bloomScore={85} trendScore={75} yoyScore={90} />,
    );

    expect(getByTestId('now-score-badge-bloom-peak')).toBeTruthy();
    expect(getByTestId('now-score-badge-trending')).toBeTruthy();
    expect(getByTestId('now-score-badge-yoy-rising')).toBeTruthy();
  });

  it('모든 점수가 임계값 미달이면 컴포넌트가 null을 반환한다', () => {
    const { queryByTestId } = render(
      <View testID="parent">
        <NowScoreBadges bloomScore={10} trendScore={20} yoyScore={30} />
      </View>,
    );

    expect(queryByTestId('now-score-badges')).toBeNull();
    expect(queryByTestId('now-score-badge-bloom-peak')).toBeNull();
    expect(queryByTestId('now-score-badge-trending')).toBeNull();
    expect(queryByTestId('now-score-badge-yoy-rising')).toBeNull();
  });

  it('점수 자체가 없으면 null을 반환한다', () => {
    const { queryByTestId } = render(<NowScoreBadges />);

    expect(queryByTestId('now-score-badges')).toBeNull();
  });
});
