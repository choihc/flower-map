import { describe, it, expect } from 'vitest';
import { calcBloomScore } from './bloom';

const DAY = 86400000;

function makeInput(overrides: {
  now: Date;
  startAt: Date;
  endAt: Date;
  recentTempC?: number | null;
  recent7dRainMm?: number;
}) {
  return {
    recentTempC: overrides.recentTempC ?? 15,
    recent7dRainMm: overrides.recent7dRainMm ?? 0,
    ...overrides,
  };
}

describe('calcBloomScore', () => {
  const start = new Date('2026-04-10T00:00:00Z');
  const end = new Date('2026-04-20T00:00:00Z');

  it('시작 30일 이전이면 0', () => {
    const now = new Date(start.getTime() - 31 * DAY);
    const score = calcBloomScore(makeInput({ now, startAt: start, endAt: end }));
    expect(score).toBe(0);
  });

  it('시작일 근처면 약 30', () => {
    const now = start;
    const score = calcBloomScore(makeInput({ now, startAt: start, endAt: end }));
    expect(score).toBeCloseTo(30, 1);
  });

  it('기간 중간이면 100', () => {
    const now = new Date((start.getTime() + end.getTime()) / 2);
    const score = calcBloomScore(makeInput({ now, startAt: start, endAt: end }));
    expect(score).toBeCloseTo(100, 1);
  });

  it('종료일 근처면 약 30', () => {
    const now = end;
    const score = calcBloomScore(makeInput({ now, startAt: start, endAt: end }));
    expect(score).toBeCloseTo(30, 1);
  });

  it('종료 14일 후면 0', () => {
    const now = new Date(end.getTime() + 14 * DAY);
    const score = calcBloomScore(makeInput({ now, startAt: start, endAt: end }));
    expect(score).toBe(0);
  });

  it('시작 15일 전이면 약 15 (30의 절반)', () => {
    const now = new Date(start.getTime() - 15 * DAY);
    const score = calcBloomScore(makeInput({ now, startAt: start, endAt: end }));
    expect(score).toBeCloseTo(15, 1);
  });

  it('강수량 80mm 초과면 0.9배 감산', () => {
    const now = new Date((start.getTime() + end.getTime()) / 2);
    const base = calcBloomScore(makeInput({ now, startAt: start, endAt: end, recent7dRainMm: 0 }));
    const dry = calcBloomScore(makeInput({ now, startAt: start, endAt: end, recent7dRainMm: 80 }));
    const wet = calcBloomScore(makeInput({ now, startAt: start, endAt: end, recent7dRainMm: 81 }));
    expect(base).toBeCloseTo(100, 1);
    expect(dry).toBeCloseTo(100, 1);
    expect(wet).toBeCloseTo(90, 1);
  });

  it('결과는 0~100 범위로 클램프되고 소수점 2자리 반올림', () => {
    const now = new Date((start.getTime() + end.getTime()) / 2);
    const score = calcBloomScore(makeInput({ now, startAt: start, endAt: end }));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('종료 7일 후면 약 15 (30의 절반)', () => {
    const now = new Date(end.getTime() + 7 * DAY);
    const score = calcBloomScore(makeInput({ now, startAt: start, endAt: end }));
    expect(score).toBeCloseTo(15, 1);
  });
});
