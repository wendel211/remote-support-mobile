import React from 'react';
import { Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { Box, HStack, Text, VStack } from '@shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelection'>;

export function RoleSelectionScreen({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <Box
      className="flex-1 bg-[#F3F4F6] px-7"
      style={{
        paddingTop: Math.max(insets.top, 24) + 16,
        paddingBottom: Math.max(insets.bottom, 20),
      }}
    >
      <VStack className="flex-1" space="xl">
        <HStack className="items-center justify-center" space="xs">
          <HeadsetIcon />
          <Text className="text-[19px] leading-[23px] text-black" weight="bold">
            Remote Support
          </Text>
        </HStack>

        <VStack className="mt-10" space="lg">
          <HStack space="sm">
            <Box className="rounded-md bg-[#EAF2FF] px-2.5 py-1.5">
              <HStack className="items-center" space="xs">
                <RemoteBadgeIcon />
                <Text className="text-[11px] leading-3 text-[#2563EB]" weight="medium">
                  Suporte remoto
                </Text>
              </HStack>
            </Box>

            <Box className="rounded-md bg-[#DFF8ED] px-2.5 py-1.5">
              <HStack className="items-center" space="xs">
                <RealtimeBadgeIcon />
                <Text className="text-[11px] leading-3 text-[#059669]" weight="medium">
                  Tempo real
                </Text>
              </HStack>
            </Box>
          </HStack>

          <VStack space="sm">
            <Text className="text-[25px] leading-[29px] text-black" weight="bold">
              Selecione o seu perfil
            </Text>
            <Text className="max-w-[260px] text-[13px] leading-[20px] text-[#64748B]">
              Conecte atendente e cliente em uma sessao segura com chat,
              screenshot e comandos remotos.
            </Text>
          </VStack>
        </VStack>

        <VStack className="mt-5" space="md">
          <RoleCard
            icon={<AttendantIcon />}
            iconClassName="bg-[#F1F5F9]"
            title="Sou atendente"
            description="Vou gerar um codigo de sessao para prestar suporte remoto."
            onPress={() => navigation.navigate('Attendant')}
          />

          <RoleCard
            icon={<ClientIcon />}
            iconClassName="bg-[#F8FAFC]"
            title="Sou cliente"
            description="Tenho um codigo e preciso receber assistencia tecnica."
            onPress={() => navigation.navigate('Client')}
          />
        </VStack>

        <HStack className="mt-auto items-start px-3 pb-1" space="sm">
          <InfoIcon />
          <Text className="flex-1 text-[10px] leading-[15px] text-[#64748B]">
            <Text className="text-[10px] text-[#475569]" weight="bold">
              Como funciona:
            </Text>{' '}
            O atendente inicia uma sessao e compartilha um codigo seguro. O
            cliente insere este codigo para autorizar a conexao e iniciar o
            suporte.
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}

interface RoleCardProps {
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  description: string;
  onPress: () => void;
}

function RoleCard({
  icon,
  iconClassName,
  title,
  description,
  onPress,
}: RoleCardProps): React.JSX.Element {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <HStack
          className={`min-h-[96px] items-center rounded-xl border border-[#E5E7EB] bg-white px-5 py-4 shadow-sm ${pressed ? 'opacity-85' : 'opacity-100'
            }`}
        >
          <Box className={`mr-4 h-12 w-12 items-center justify-center rounded-lg ${iconClassName}`}>
            {icon}
          </Box>
          <VStack className="flex-1" space="xs">
            <Text className="text-[16px] leading-[20px] text-black" weight="bold">
              {title}
            </Text>
            <Text className="max-w-[180px] text-[11px] leading-[15px] text-[#64748B]">
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
  return (
    <Box className="h-[18px] w-[18px]">
      <Box className="absolute left-[3px] top-[2px] h-[12px] w-[12px] rounded-t-full border-2 border-b-0 border-[#2563EB]" />
      <Box className="absolute bottom-[2px] left-[1px] h-[7px] w-[4px] rounded-sm bg-[#2563EB]" />
      <Box className="absolute bottom-[2px] right-[1px] h-[7px] w-[4px] rounded-sm bg-[#2563EB]" />
      <Box className="absolute bottom-[1px] left-[8px] h-[2px] w-[5px] rounded-full bg-[#2563EB]" />
    </Box>
  );
}

function RemoteBadgeIcon(): React.JSX.Element {
  return (
    <Box className="h-[10px] w-[10px] rounded-full border border-[#2563EB]">
      <Box className="absolute left-[3px] top-[3px] h-[4px] w-[4px] rounded-full bg-[#2563EB]" />
    </Box>
  );
}

function RealtimeBadgeIcon(): React.JSX.Element {
  return (
    <Box className="h-[11px] w-[8px]">
      <Box
        className="absolute left-[2px] top-0 h-[9px] w-[2px] rounded-full bg-[#059669]"
        style={{ transform: [{ rotate: '22deg' }] }}
      />
      <Box
        className="absolute bottom-0 right-[1px] h-[7px] w-[2px] rounded-full bg-[#059669]"
        style={{ transform: [{ rotate: '22deg' }] }}
      />
    </Box>
  );
}

function AttendantIcon(): React.JSX.Element {
  return (
    <MaterialCommunityIcons name="tools" size={27} color="#475569" />
  );
}

function ClientIcon(): React.JSX.Element {
  return (
    <Box className="h-7 w-7 items-center">
      <Box className="mt-[5px] h-[9px] w-[9px] rounded-full bg-[#374151]" />
      <Box className="mt-[2px] h-[9px] w-[16px] rounded-t-full bg-[#374151]" />
    </Box>
  );
}

function InfoIcon(): React.JSX.Element {
  return (
    <Box className="mt-[1px] h-[14px] w-[14px] items-center justify-center rounded-full bg-[#64748B]">
      <Text className="text-[9px] leading-[11px] text-white" weight="bold">
        i
      </Text>
    </Box>
  );
}

function ChevronIcon(): React.JSX.Element {
  return (
    <Box className="h-[16px] w-[9px]">
      <Box
        className="absolute right-[2px] top-[3px] h-[9px] w-[2px] rounded-full bg-[#CBD5E1]"
        style={{ transform: [{ rotate: '-45deg' }] }}
      />
      <Box
        className="absolute right-[2px] bottom-[3px] h-[9px] w-[2px] rounded-full bg-[#CBD5E1]"
        style={{ transform: [{ rotate: '45deg' }] }}
      />
    </Box>
  );
}
