import React from 'react';
import { View } from 'react-native';

type Props = { children?: React.ReactNode; [key: string]: any };

const Icon = ({ name, size, color }: Props) => (
  <View style={{ width: size ?? 20, height: size ?? 20 }} />
);

const PageNavbar = ({ children }: Props) => <>{children}</>;
PageNavbar.Title = ({ children }: Props) => <>{children}</>;
PageNavbar.AccessoryButtons = ({ children }: Props) => <>{children}</>;
PageNavbar.AccessoryTextButton = ({ children, onPress }: Props) => (
  <button onClick={onPress}>{children}</button>
);
PageNavbar.AccessoryIconButton = ({ name, onPress }: Props) => (
  <button onClick={onPress}>{name}</button>
);

const Carousel = ({ children }: Props) => <div>{children}</div>;
Carousel.Item = ({ children }: Props) => <div>{children}</div>;

const Badge = ({ children }: Props) => <span>{children}</span>;
const Button = ({ children, onPress, disabled }: Props) => (
  <button onClick={onPress} disabled={disabled}>{children}</button>
);
const ListRow = ({ contents, left, right, onPress }: Props) => (
  <div onClick={onPress}>{left}{contents}{right}</div>
);
ListRow.Texts = ({ texts }: Props) => (
  <>{(texts ?? []).map((t: any) => <span key={t.text}>{t.text}</span>)}</>
);
const SearchField = ({ onChange, value, placeholder, hasClearButton }: Props) => (
  <div>
    <input
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange?.({ nativeEvent: { text: (e.target as any).value } })}
    />
  </div>
);
const Loader = () => <div>Loading...</div>;
Loader.FullScreen = () => <div>Loading...</div>;
const ErrorPage = ({ title, subtitle, onPressRightButton }: Props) => (
  <div>
    <p>{title ?? '오류'}</p>
    {subtitle && <p>{subtitle}</p>}
    {onPressRightButton && <button onClick={onPressRightButton}>확인</button>}
  </div>
);

export {
  PageNavbar, Icon, Badge, Button, ListRow, SearchField, Loader, ErrorPage,
};
