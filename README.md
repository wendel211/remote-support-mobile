# Remote Support Mobile

Aplicativo React Native com Expo para suporte técnico remoto em tempo real. O app possui dois perfis, Atendente e Cliente, pareados por código de sessão. Durante a sessão, os usuários podem trocar mensagens, solicitar captura da tela do app do Cliente, enviar comandos predefinidos e abrir URLs em uma WebView in-app.

## Stack

- Expo SDK 56
- React Native 0.85
- TypeScript
- Firebase Realtime Database
- Redux Toolkit
- React Navigation
- Gluestack UI + NativeWind
- Poppins via `expo-font`
- `react-native-view-shot`
- `react-native-webview`

## Funcionalidades

- Seleção de perfil no início do fluxo.
- Atendente gera um código de sessão de 6 caracteres.
- Cliente entra usando o código informado pelo atendente.
- Status de sessão em tempo real: aguardando, conectado e encerrado.
- Chat bidirecional com indicador de digitação.
- Solicitação de captura da tela renderizada do app do Cliente pelo Atendente.
- Visualizador dedicado para a captura recebida.
- Comandos predefinidos enviados do Atendente para o Cliente.
- Comando de navegação abre URL em WebView in-app.
- WebView também pode ser aberta por links enviados no chat.
- Monitoramento de performance com FPS, tempo de renderização e JS heap, com relatório no console ao encerrar ou desmontar a sessão monitorada.

## Requisitos

- Node.js 18+
- npm
- Expo Go ou ambiente Android/iOS configurado
- Projeto Firebase com Realtime Database habilitado

## Instalação

```bash
npm install
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Preencha as variáveis com os dados do seu projeto Firebase.

## Variáveis de ambiente

O Expo expõe para o app apenas variáveis com prefixo `EXPO_PUBLIC_`.

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_DATABASE_URL=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

## Firebase Realtime Database

O app usa o Firebase Realtime Database como servidor de comunicação em tempo real. A estrutura principal fica sob `sessions/{sessionCode}`.

Exemplo de dados gravados durante uma sessão:

```txt
sessions/{code}
  status
  attendantConnected
  clientConnected
  attendantOnline
  clientOnline
  createdAt
  messages
  typing
  pendingScreenshot
  commands
```

Para desenvolvimento, configure regras adequadas ao ambiente de teste. Em produção, as regras devem ser endurecidas com autenticação e validação por sessão.

Regras de desenvolvimento para o desafio:

```json
{
  "rules": {
    "sessions": {
      "$sessionCode": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

No Firebase Console, acesse Realtime Database > Rules, cole o conteúdo acima e publique. O mesmo conteúdo está em `database.rules.json`.

Se o app mostrar `Permissão negada no Firebase`, significa que o banco atual está com regras mais restritivas ou que a variável `EXPO_PUBLIC_FIREBASE_DATABASE_URL` aponta para outro projeto ou banco.

## Execução

Iniciar o Expo:

```bash
npm start
```

Rodar com túnel:

```bash
npm run start:tunnel
```

Android:

```bash
npm run android
```

iOS:

```bash
npm run ios
```

Web:

```bash
npm run web
```

Validar TypeScript:

```bash
npm run typecheck
```

Conferir compatibilidade de dependências Expo:

```bash
npx expo install --check
```

## Fluxo de uso

1. Abra o app como Atendente.
2. O app cria uma sessão e exibe um código.
3. Abra outra instância do app como Cliente.
4. Digite o código de sessão.
5. Com a sessão conectada, teste:
   - mensagens nos dois sentidos;
   - indicador de digitação;
   - solicitação de captura da tela do app pelo Atendente;
   - comandos predefinidos;
   - comando de URL abrindo WebView;
   - encerramento da sessão por qualquer perfil.

## Arquitetura

O projeto usa organização por feature:

```txt
src
  app              providers e composição global
  features         módulos de produto
    chat           chat, typing e mensagens
    commands       comandos remotos
    performance    medição e relatório de performance
    screenshot     solicitação, captura e visualização
    session        criação, entrada e encerramento de sessão
    webview        navegação in-app
  navigation       stack e tipos de rotas
  services         integrações externas
  shared           UI reutilizável
  store            Redux store raiz
```

As features mantêm seus componentes, services, stores e tipos próximos. Código compartilhado fica em `src/shared`.

## Decisões técnicas

- Firebase Realtime Database foi escolhido para reduzir a complexidade de servidor e entregar comunicação em tempo real sem backend Node dedicado.
- Redux Toolkit centraliza estados compartilhados de sessão, chat, comandos, captura de tela e performance.
- Gluestack UI com NativeWind fornece uma base visual consistente e reduz repetição de `StyleSheet`.
- A tipografia do app usa Poppins nos textos, botões, badges, inputs e telas modais para manter consistência visual.
- `react-native-view-shot` captura a superfície renderizada do app do Cliente para envio imediato ao Atendente. Em Expo, esta abordagem evita permissões nativas sensíveis para captura da tela inteira do sistema operacional.
- WebView in-app evita abrir navegador externo durante o suporte.
- A presença online/offline usa `onDisconnect` do Firebase para marcar quedas inesperadas de conexão e encerrar a sessão quando um perfil desconecta.

## Performance

O monitoramento inicia quando a sessão entra em estado conectado. Ao desmontar a tela ou encerrar a sessão monitorada, o app gera um relatório no console com:

- FPS médio, mínimo e máximo;
- tempo médio de renderização por componente monitorado;
- média e pico de JS heap quando disponível.

Observação: `performance.memory` pode não estar disponível em todos os runtimes React Native. Quando indisponível, os valores de JS heap podem aparecer como `0`.

Para demonstrar no vídeo, mantenha o console do Metro visível e encerre a sessão pelo app. O grupo `RELATÓRIO DE PERFORMANCE - SESSÃO DE SUPORTE` deve aparecer no console com FPS, JS heap e tempos de renderização.

O relatório é exibido em tabelas no Metro, com resumo da sessão, contagem de amostras coletadas, status de FPS/heap e lista de componentes ordenada pelo maior tempo médio de renderização.

## Limitações conhecidas

- A captura de tela registra a tela renderizada pelo app, não a tela inteira do sistema operacional.
- O código de sessão é gerado localmente; uma melhoria futura é verificar colisão no Firebase antes de criar a sessão.
- Não há autenticação completa, conforme permitido pelo desafio.
- Notificações locais em background não foram implementadas porque são requisito opcional.
- Testes automatizados ainda precisam ser adicionados para atingir a cobertura exigida pelo desafio.

## Vídeo de demonstração

O desafio exige um vídeo de 1 a 3 minutos. O vídeo deve mostrar:

- seleção de perfil;
- pareamento por código;
- chat em tempo real;
- solicitação de captura pelo Atendente;
- envio automático da captura da tela do app pelo Cliente;
- visualização da captura recebida no visualizador dedicado;
- envio de comandos;
- WebView in-app;
- relatório de performance no console ao encerrar a sessão.
