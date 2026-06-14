import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  RoleSelection: undefined;
  Attendant: undefined;
  Client: undefined;
  WebView: { url: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
