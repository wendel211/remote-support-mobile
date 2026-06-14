# Remote Support Mobile

Aplicativo React Native com Expo para suporte tecnico remoto em tempo real. O app possui dois perfis, Atendente e Cliente, pareados por codigo de sessao. Durante a sessao, os usuarios podem trocar mensagens, solicitar captura da tela do app do Cliente, enviar comandos predefinidos e abrir URLs em uma WebView in-app.

## Stack

- Expo SDK 56
- React Native 0.85
- TypeScript
- Firebase Realtime Database
- Redux Toolkit
- React Navigation
- Gluestack UI + NativeWind
- `react-native-view-shot`
- `react-native-webview`

## Funcionalidades

- Selecao de perfil no inicio do fluxo.
- Atendente gera um codigo de sessao de 6 caracteres.
- Cliente entra usando o codigo informado pelo atendente.
- Status de sessao em tempo real: aguardando, conectado e encerrado.
- Chat bidirecional com indicador de digitacao.
- Solicitacao de captura da tela renderizada do app do Cliente pelo Atendente.
- Visualizador dedicado para captura recebida.
- Comandos predefinidos enviados do Atendente para o Cliente.
- Comando de navegacao abre URL em WebView in-app.
- WebView tambem pode ser aberta por links enviados no chat.
- Monitoramento de performance com FPS, tempo de render e JS heap, com relatorio no console ao encerrar/desmontar a sessao monitorada.

## Requisitos

- Node.js 18+
- npm
- Expo Go ou ambiente Android/iOS configurado
- Projeto Firebase com Realtime Database habilitado

## Instalacao

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

Preencha as variaveis com os dados do seu projeto Firebase.

## Variaveis de ambiente

O Expo expoe para o app apenas variaveis com prefixo `EXPO_PUBLIC_`.

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

O app usa o Firebase Realtime Database como servidor de comunicacao em tempo real. A estrutura principal fica sob `sessions/{sessionCode}`.

Exemplo de dados gravados durante uma sessao:

```txt
sessions/{code}
  status
  attendantConnected
  clientConnected
  createdAt
  messages
  typing
  pendingScreenshot
  commands
```

Para desenvolvimento, configure regras adequadas ao ambiente de teste. Em producao, as regras devem ser endurecidas com autenticacao e validacao por sessao.

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

No Firebase Console, acesse Realtime Database > Rules, cole o conteudo acima e publique. O mesmo conteudo esta em `database.rules.json`.

Se o app mostrar `Permissao negada no Firebase`, significa que o banco atual esta com regras mais restritivas ou que a variavel `EXPO_PUBLIC_FIREBASE_DATABASE_URL` aponta para outro projeto/banco.

## Execucao

Iniciar o Expo:

```bash
npm start
```

Rodar com tunnel:

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

Conferir compatibilidade de dependencias Expo:

```bash
npx expo install --check
```

## Fluxo de uso

1. Abra o app como Atendente.
2. O app cria uma sessao e exibe um codigo.
3. Abra outra instancia do app como Cliente.
4. Digite o codigo de sessao.
5. Com a sessao conectada, teste:
   - mensagens nos dois sentidos;
   - indicador de digitacao;
   - solicitacao de captura da tela do app pelo Atendente;
   - comandos predefinidos;
   - comando de URL abrindo WebView;
   - encerramento da sessao por qualquer perfil.

## Arquitetura

O projeto usa organizacao por feature:

```txt
src
  app              providers e composicao global
  features         modulos de produto
    chat           chat, typing e mensagens
    commands       comandos remotos
    performance    medicao e relatorio de performance
    screenshot     solicitacao, captura e visualizacao
    session        criacao, entrada e encerramento de sessao
    webview        navegacao in-app
  navigation       stack e tipos de rotas
  services         integracoes externas
  shared           UI reutilizavel
  store            Redux store raiz
```

As features mantem seus componentes, services, stores e tipos proximos. Codigo compartilhado fica em `src/shared`.

## Decisoes tecnicas

- Firebase Realtime Database foi escolhido para reduzir complexidade de servidor e entregar comunicacao em tempo real sem backend Node dedicado.
- Redux Toolkit centraliza estados compartilhados de sessao, chat, comandos, screenshot e performance.
- Gluestack UI com NativeWind fornece uma base visual consistente e reduz repeticao de `StyleSheet`.
- `react-native-view-shot` captura a superficie renderizada do app do Cliente para envio imediato ao Atendente. Em Expo, esta abordagem evita permissoes nativas sensiveis para captura da tela inteira do sistema operacional.
- WebView in-app evita abrir navegador externo durante o suporte.

## Performance

O monitoramento inicia quando a sessao entra em estado conectado. Ao desmontar a tela ou encerrar a sessao monitorada, o app gera um relatorio no console com:

- FPS medio, minimo e maximo;
- tempo medio de render por componente monitorado;
- media e pico de JS heap quando disponivel.

Observacao: `performance.memory` pode nao estar disponivel em todos os runtimes React Native. Quando indisponivel, os valores de JS heap podem aparecer como `0`.

## Limitacoes conhecidas

- O screenshot captura a tela renderizada pelo app, nao a tela inteira do sistema operacional.
- O codigo de sessao e gerado localmente; uma melhoria futura e verificar colisao no Firebase antes de criar a sessao.
- Nao ha autenticacao completa, conforme permitido pelo desafio.
- Notificacoes locais em background nao foram implementadas porque sao requisito opcional.
- Testes automatizados ainda precisam ser adicionados para atingir a cobertura exigida pelo desafio.

## Video de demonstracao

O desafio exige um video de 1 a 3 minutos. O video deve mostrar:

- selecao de perfil;
- pareamento por codigo;
- chat em tempo real;
- solicitacao de captura pelo Atendente;
- envio automatico da captura da tela do app pelo Cliente;
- visualizacao da captura recebida no visualizador dedicado;
- envio de comandos;
- WebView in-app;
- relatorio de performance no console ao encerrar a sessao.
