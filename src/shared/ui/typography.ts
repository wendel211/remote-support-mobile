import type { TextStyle } from 'react-native';

export type PoppinsWeight = 'regular' | 'medium' | 'semibold' | 'bold';

const poppinsFamilyByWeight: Record<PoppinsWeight, string> = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export function getPoppinsTextStyle(weight: PoppinsWeight = 'regular'): TextStyle {
  return {
    fontFamily: poppinsFamilyByWeight[weight],
  };
}
