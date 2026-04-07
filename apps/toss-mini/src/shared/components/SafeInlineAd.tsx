import { getTossAppVersion, InlineAd, type InlineAdProps } from '@apps-in-toss/framework';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { isInlineAdSupported } from '../utils/tossAppVersion';

type SafeInlineAdProps = InlineAdProps & {
  style?: StyleProp<ViewStyle>;
};

export function SafeInlineAd({ style, ...props }: SafeInlineAdProps) {
  const appVersion = getTossAppVersion();

  if (!isInlineAdSupported(appVersion)) {
    return null;
  }

  return (
    <View style={style}>
      <InlineAd {...props} />
    </View>
  );
}
