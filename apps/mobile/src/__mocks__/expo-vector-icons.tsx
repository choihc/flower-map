// mock for @expo/vector-icons in vitest (jsdom environment)
import React from 'react';

type IconProps = {
  color?: string;
  name?: string;
  size?: number;
  testID?: string;
};

function createIconComponent(family: string) {
  function IconMock({ name, testID, color: _color, size: _size }: IconProps) {
    return React.createElement('span', {
      'data-icon-family': family,
      'data-icon-name': name,
      'data-testid': testID,
    });
  }
  IconMock.displayName = family;
  return IconMock;
}

export const Ionicons = createIconComponent('Ionicons');
export const MaterialIcons = createIconComponent('MaterialIcons');
export const FontAwesome = createIconComponent('FontAwesome');
export const AntDesign = createIconComponent('AntDesign');
export const Entypo = createIconComponent('Entypo');
export const Feather = createIconComponent('Feather');

export default {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  AntDesign,
  Entypo,
  Feather,
};
