import { GestureResponderEvent, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Stay } from '../../../shared/data/types';
import { colors } from '../../../shared/theme/colors';
import { openAgodaHotel, openTripcomHotel } from '../lib/affiliateHotel';

type Props = {
  stay: Stay | null;
  onClose: () => void;
};

export function BookingProviderSheet({ stay, onClose }: Props) {
  const handleTripcom = () => {
    if (stay) {
      void openTripcomHotel({
        name: stay.name,
        queryOverride: stay.bookingQueryOverride,
        tripcomBookingUrl: stay.tripcomBookingUrl,
      });
    }
    onClose();
  };

  const handleAgoda = () => {
    if (stay) {
      void openAgodaHotel({
        name: stay.name,
        queryOverride: stay.bookingQueryOverride,
        agodaHotelId: stay.agodaHotelId,
      });
    }
    onClose();
  };

  return (
    <Modal visible={stay != null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable testID="booking-sheet-backdrop" style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e: GestureResponderEvent) => { (e as unknown as Event).stopPropagation?.(); }}>
          <View style={styles.handle} />
          <Text style={styles.title}>어디서 예약할까요?</Text>
          <Pressable testID="booking-sheet-tripcom" style={styles.row} onPress={handleTripcom}>
            <Text style={styles.rowText}>trip.com에서 예약하기</Text>
            <Text style={styles.rowArrow}>→</Text>
          </Pressable>
          <Pressable testID="booking-sheet-agoda" style={styles.row} onPress={handleAgoda}>
            <Text style={styles.rowText}>Agoda에서 예약하기</Text>
            <Text style={styles.rowArrow}>→</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 10,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: 8,
    width: 40,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  rowArrow: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
});
