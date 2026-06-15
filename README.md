# Remote Support Mobile

Aplicativo React Native com Expo para suporte tÃ©cnico remoto em tempo real. O app possui dois perfis, Atendente e Cliente, pareados por cÃ³digo de sessÃ£o. Durante a sessÃ£o, os usuÃ¡rios podem trocar mensagens, solicitar captura da tela do app do Cliente, enviar comandos predefinidos e abrir URLs em uma WebView in-app.

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

- SeleÃ§Ã£o de perfil no inÃ­cio do fluxo.
- Atendente gera um cÃ³digo de sessÃ£o de 6 caracteres.
- Cliente entra usando o cÃ³digo informado pelo atendente.
- Status de sessÃ£o em tempo real: aguardando, conectado e encerrado.
- Chat bidirecional com indicador de digitaÃ§Ã£o.
- SolicitaÃ§Ã£o de captura da tela renderizada do app do Cliente pelo Atendente.
- Visualizador dedicado para a captura recebida.
- Comandos predefinidos enviados do Atendente para o Cliente.
- Comando de navegaÃ§Ã£o abre URL em WebView in-app.
- WebView tambÃ©m pode ser aberta por links enviados no chat.
- Monitoramento de performance com FPS, tempo de renderizaÃ§Ã£o e JS heap, com relatÃ³rio no console ao encerrar ou desmontar a sessÃ£o monitorada.

## Requisitos

- Node.js 18+
- npm
- Expo Go ou ambiente Android/iOS configurado
- Projeto Firebase com Realtime Database habilitado

## InstalaÃ§Ã£o

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

Preencha as variÃ¡veis com os dados do seu projeto Firebase.

## VariÃ¡veis de ambiente

O Expo expÃµe para o app apenas variÃ¡veis com prefixo `EXPO_PUBLIC_`.

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

O app usa o Firebase Realtime Database como servidor de comunicaÃ§Ã£o em tempo real. A estrutura principal fica sob `sessions/{sessionCode}`.

Exemplo de dados gravados durante uma sessÃ£o:

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

Para desenvolvimento, configure regras adequadas ao ambiente de teste. Em produÃ§Ã£o, as regras devem ser endurecidas com autenticaÃ§Ã£o e validaÃ§Ã£o por sessÃ£o.

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

No Firebase Console, acesse Realtime Database > Rules, cole o conteÃºdo acima e publique. O mesmo conteÃºdo estÃ¡ em `database.rules.json`.

Se o app mostrar `PermissÃ£o negada no Firebase`, significa que o banco atual estÃ¡ com regras mais restritivas ou que a variÃ¡vel `EXPO_PUBLIC_FIREBASE_DATABASE_URL` aponta para outro projeto ou banco.

## ExecuÃ§Ã£o

Iniciar o Expo:

```bash
npm start
```

Rodar com tÃºnel:

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

Conferir compatibilidade de dependÃªncias Expo:

```bash
npx expo install --check
```

## Fluxo de uso

1. Abra o app como Atendente.
2. O app cria uma sessÃ£o e exibe um cÃ³digo.
3. Abra outra instÃ¢ncia do app como Cliente.
4. Digite o cÃ³digo de sessÃ£o.
5. Com a sessÃ£o conectada, teste:
   - mensagens nos dois sentidos;
   - indicador de digitaÃ§Ã£o;
   - solicitaÃ§Ã£o de captura da tela do app pelo Atendente;
   - comandos predefinidos;
   - comando de URL abrindo WebView;
   - encerramento da sessÃ£o por qualquer perfil.

## Arquitetura

O projeto usa organizaÃ§Ã£o por feature:

```txt
src
  app              providers e composiÃ§Ã£o global
  features         mÃ³dulos de produto
    chat           chat, typing e mensagens
    commands       comandos remotos
    performance    mediÃ§Ã£o e relatÃ³rio de performance
    screenshot     solicitaÃ§Ã£o, captura e visualizaÃ§Ã£o
    session        criaÃ§Ã£o, entrada e encerramento de sessÃ£o
    webview        navegaÃ§Ã£o in-app
  navigation       stack e tipos de rotas
  services         integraÃ§Ãµes externas
  shared           UI reutilizÃ¡vel
  store            Redux store raiz
```

As features mantÃªm seus componentes, services, stores e tipos prÃ³ximos. CÃ³digo compartilhado fica em `src/shared`.

## DecisÃµes tÃ©cnicas

- Firebase Realtime Database foi escolhido para reduzir a complexidade de servidor e entregar comunicaÃ§Ã£o em tempo real sem backend Node dedicado.
- Redux Toolkit centraliza estados compartilhados de sessÃ£o, chat, comandos, captura de tela e performance.
- Gluestack UI com NativeWind fornece uma base visual consistente e reduz repetiÃ§Ã£o de `StyleSheet`.
- A tipografia do app usa Poppins nos textos, botÃµes, badges, inputs e telas modais para manter consistÃªncia visual.
- `react-native-view-shot` captura a superfÃ­cie renderizada do app do Cliente para envio imediato ao Atendente. Em Expo, esta abordagem evita permissÃµes nativas sensÃ­veis para captura da tela inteira do sistema operacional.
- WebView in-app evita abrir navegador externo durante o suporte.
- A presenÃ§a online/offline usa `onDisconnect` do Firebase para marcar quedas inesperadas de conexÃ£o e encerrar a sessÃ£o quando um perfil desconecta.

## Performance

O monitoramento inicia quando a sessão entra em estado conectado. Ao desmontar a tela ou encerrar a sessão monitorada, o app gera no Metro o grupo `PERFORMANCE REPORT - SUPPORT SESSION`.

A coleta inclui:

- FPS por janela de aproximadamente 1 segundo, calculado com `requestAnimationFrame`;
- tempo médio de frame, pior frame, P95 de frame, frames estimados perdidos e taxa de jank;
- tempo de render por componente instrumentado, medindo o intervalo entre o início do render funcional e o commit observado no `useEffect`;
- quantidade de renders, média, mediana, P95, máximo, renders acima de 16 ms e intervalo médio entre renders por componente;
- JS heap inicial, final, médio, pico e variação quando `performance.memory` está disponível no runtime.

Observação: alguns runtimes nativos do React Native não expõem `performance.memory`. Quando isso acontece, o relatório marca a memória como indisponível em vez de apresentar valores artificiais.

Para demonstrar no vídeo, mantenha o console do Metro visível e encerre a sessão pelo app. O relatório aparece em tabelas com resumo da sessão, diagnóstico de FPS, renderização por componente, memória JS e leitura técnica final.

## LimitaÃ§Ãµes conhecidas

- A captura de tela registra a tela renderizada pelo app, nÃ£o a tela inteira do sistema operacional.
- O cÃ³digo de sessÃ£o Ã© gerado localmente; uma melhoria futura Ã© verificar colisÃ£o no Firebase antes de criar a sessÃ£o.
- NÃ£o hÃ¡ autenticaÃ§Ã£o completa, conforme permitido pelo desafio.
- NotificaÃ§Ãµes locais em background nÃ£o foram implementadas porque sÃ£o requisito opcional.
- Testes automatizados ainda precisam ser adicionados para atingir a cobertura exigida pelo desafio.

## VÃ­deo de demonstraÃ§Ã£o

O desafio exige um vÃ­deo de 1 a 3 minutos. O vÃ­deo deve mostrar:

- seleÃ§Ã£o de perfil;
- pareamento por cÃ³digo;
- chat em tempo real;
- solicitaÃ§Ã£o de captura pelo Atendente;
- envio automÃ¡tico da captura da tela do app pelo Cliente;
- visualizaÃ§Ã£o da captura recebida no visualizador dedicado;
- envio de comandos;
- WebView in-app;
- relatÃ³rio de performance no console ao encerrar a sessÃ£o.
