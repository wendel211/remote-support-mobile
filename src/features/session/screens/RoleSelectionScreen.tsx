import React from 'react';
import { Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { Box, HStack, Text, VStack, useTheme } from '@shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelection'>;

export function RoleSelectionScreen({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <Box
      className="flex-1 px-7"
      style={{
        backgroundColor: colors.bg,
        paddingTop: Math.max(insets.top, 24) + 16,
        paddingBottom: Math.max(insets.bottom, 20),
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <VStack className="flex-1" space="xl">
        <HStack className="items-center justify-between" space="xs">
          <Box className="w-9 h-9 items-center justify-center" />

          <HStack className="items-center justify-center flex-1" space="xs">
            <HeadsetIcon />
            <Text className="text-[19px] leading-[23px]" style={{ color: colors.text }} weight="bold">
              Remote Support
            </Text>
          </HStack>

          <Pressable
            onPress={toggleTheme}
            className="w-9 h-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.surfaceElevated }}
          >
            <MaterialCommunityIcons
              name={isDark ? 'weather-sunny' : 'weather-night'}
              size={20}
              color={isDark ? '#F59E0B' : colors.iconDefault}
            />
          </Pressable>
        </HStack>

        <VStack className="mt-10" space="lg">
          <HStack space="sm">
            <Box className="rounded-md px-2.5 py-1.5" style={{ backgroundColor: colors.accentSoft }}>
              <HStack className="items-center" space="xs">
                <RemoteBadgeIcon />
                <Text className="text-[11px] leading-3" style={{ color: colors.accent }} weight="medium">
                  Suporte remoto
                </Text>
              </HStack>
            </Box>

            <Box className="rounded-md px-2.5 py-1.5" style={{ backgroundColor: colors.successSoft }}>
              <HStack className="items-center" space="xs">
                <RealtimeBadgeIcon />
                <Text className="text-[11px] leading-3" style={{ color: colors.success }} weight="medium">
                  Tempo real
                </Text>
              </HStack>
            </Box>
          </HStack>

          <VStack space="sm">
            <Text className="text-[25px] leading-[29px]" style={{ color: colors.text }} weight="bold">
              Escolha o seu perfil
            </Text>
            <Text className="max-w-[260px] text-[13px] leading-[20px]" style={{ color: colors.textSecondary }}>
              Conecte sendo atendente ou cliente em uma sessão segura com chat,
              captura de tela e comandos remotos.
            </Text>
          </VStack>
        </VStack>

        <VStack className="mt-5" space="md">
          <RoleCard
            icon={<AttendantIcon />}
            title="Sou atendente"
            description="Vou gerar um código de sessão para prestar suporte remoto."
            onPress={() => navigation.navigate('Attendant')}
          />

          <RoleCard
            icon={<ClientIcon />}
            title="Sou cliente"
            description="Tenho um código e preciso receber assistência técnica."
            onPress={() => navigation.navigate('Client')}
          />
        </VStack>

        <HStack className="mt-auto items-start px-3 pb-1" space="sm">
          <InfoIcon />
          <Text className="flex-1 text-[10px] leading-[15px]" style={{ color: colors.textSecondary }}>
            <Text className="text-[10px]" style={{ color: colors.text }} weight="bold">
              Como funciona:
            </Text>{' '}
            O atendente inicia uma sessão e compartilha um código seguro. O
            cliente insere este código para autorizar a conexão e iniciar o
            suporte.
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}

function RoleCard({
  icon,
  title,
  description,
  onPress,
}: RoleCardProps): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <HStack
          className={`min-h-[96px] items-center rounded-xl border px-5 py-4 shadow-sm ${pressed ? 'opacity-85' : 'opacity-100'
            }`}
          style={{
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
            transform: [{ scale: pressed ? 0.98 : 1 }]
          }}
        >
          <Box className="mr-4 h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surfaceElevated }}>
            {icon}
          </Box>
          <VStack className="flex-1" space="xs">
            <Text className="text-[16px] leading-[20px]" style={{ color: colors.text }} weight="bold">
              {title}
            </Text>
            <Text className="max-w-[180px] text-[11px] leading-[15px]" style={{ color: colors.textSecondary }}>
              {description}
            </Text>
          </VStack>
          <ChevronIcon />
        </HStack>
      )}
    </Pressable>
  );
}

function HeadsetIcon(): React.JSX.Element {
  const { colors } = useTheme();
  const color = colors.accent;
  return (
    <Box className="h-[18px] w-[18px]">
      <Box className="absolute left-[3px] top-[2px] h-[12px] w-[12px] rounded-t-full border-2 border-b-0" style={{ borderColor: color }} />
      <Box className="absolute bottom-[2px] left-[1px] h-[7px] w-[4px] rounded-sm" style={{ backgroundColor: color }} />
      <Box className="absolute bottom-[2px] right-[1px] h-[7px] w-[4px] rounded-sm" style={{ backgroundColor: color }} />
      <Box className="absolute bottom-[1px] left-[8px] h-[2px] w-[5px] rounded-full" style={{ backgroundColor: color }} />
    </Box>
  );
}

function RemoteBadgeIcon(): React.JSX.Element {
  const { colors } = useTheme();
  const color = colors.accent;
  return (
    <Box className="h-[10px] w-[10px] rounded-full border" style={{ borderColor: color }}>
      <Box className="absolute left-[3px] top-[3px] h-[4px] w-[4px] rounded-full" style={{ backgroundColor: color }} />
    </Box>
  );
}

function RealtimeBadgeIcon(): React.JSX.Element {
  const { colors } = useTheme();
  const color = colors.success;
  return (
    <Box className="h-[11px] w-[8px]">
      <Box
        className="absolute left-[2px] top-0 h-[9px] w-[2px] rounded-full"
        style={{ backgroundColor: color, transform: [{ rotate: '22deg' }] }}
      />
      <Box
        className="absolute bottom-0 right-[1px] h-[7px] w-[2px] rounded-full"
        style={{ backgroundColor: color, transform: [{ rotate: '22deg' }] }}
      />
    </Box>
  );
}

function AttendantIcon(): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <MaterialCommunityIcons name="tools" size={27} color={colors.textSecondary} />
  );
}

function ClientIcon(): React.JSX.Element {
  const { colors } = useTheme();
  const color = colors.textSecondary;
  return (
    <Box className="h-7 w-7 items-center">
      <Box className="mt-[5px] h-[9px] w-[9px] rounded-full" style={{ backgroundColor: color }} />
      <Box className="mt-[2px] h-[9px] w-[16px] rounded-t-full" style={{ backgroundColor: color }} />
    </Box>
  );
}

function InfoIcon(): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Box className="mt-[1px] h-[14px] w-[14px] items-center justify-center rounded-full" style={{ backgroundColor: colors.iconDefault }}>
      <Text className="text-[9px] leading-[11px] text-white" weight="bold">
        i
      </Text>
    </Box>
  );
}

function ChevronIcon(): React.JSX.Element {
  const { colors } = useTheme();
  const color = colors.iconMuted;
  return (
    <Box className="h-[16px] w-[9px]">
      <Box
        className="absolute right-[2px] top-[3px] h-[9px] w-[2px] rounded-full"
        style={{ backgroundColor: color, transform: [{ rotate: '-45deg' }] }}
      />
      <Box
        className="absolute right-[2px] bottom-[3px] h-[9px] w-[2px] rounded-full"
        style={{ backgroundColor: color, transform: [{ rotate: '45deg' }] }}
      />
    </Box>
  );
}
