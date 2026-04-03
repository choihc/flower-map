import React from 'react';

type BasicProps = {
  children?: React.ReactNode;
  [key: string]: unknown;
};

export function View({ children, ...props }: BasicProps) {
  return React.createElement('View', props, children);
}

export function Text({ children, ...props }: BasicProps) {
  return React.createElement('Text', props, children);
}

export function Pressable({ children, ...props }: BasicProps) {
  return React.createElement('Pressable', props, children);
}

export function Image({ source, ...props }: BasicProps) {
  return React.createElement('Image', { source, ...props });
}

export const Alert = {
  alert: () => {},
};

export const StyleSheet = {
  create<T extends Record<string, unknown>>(styles: T): T {
    return styles;
  },
};
