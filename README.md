<div align="center">
  <img src="assets/logo/logo.png" 
       alt="Alexa Cortex API" width="200" />
  
  <h1>Alexa Cortex API</h1>
  <p>Uma API em Fastify que funciona como o "Cérebro" para Skills da Alexa, permitindo conversas fluidas usando Inteligência Artificial.</p>

  ![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=nodedotjs)
  ![Fastify](https://img.shields.io/badge/Fastify-5.8-000000?style=flat-square&logo=fastify)
  ![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)
  ![Groq](https://img.shields.io/badge/Groq-AI-F55036?style=flat-square)
  ![Neon](https://img.shields.io/badge/Neon-Postgres-00E599?style=flat-square&logo=postgresql)
  ![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat-square&logo=drizzle)
  ![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=flat-square&logo=zod)
</div>

---

### 1. Visão Geral

A **Alexa Cortex API** foi criada para resolver a limitação das respostas roteirizadas tradicionais (intents) da Alexa. Usando o ambiente Fastify, esta API atua como uma escuta inteligente: ela coleta os comandos de fala livre do usuário, envia a mensagem para um modelo de inteligência artificial de ponta (rodando na plataforma da Groq) e devolve uma resposta natural por voz. 

Além disso, a API agora possui **memória contínua de contexto**: cada interação (tanto a pergunta do usuário quanto a resposta da IA) é armazenada instantaneamente em um banco de dados PostgreSQL (via Neon e Drizzle ORM). Isso permite que a Alexa se lembre de tudo o que foi falado na sessão atual, mantendo um diálogo natural, inteligente e capaz de interpretar perguntas em sequência sem perder o fio da meada.

<br/>

[🔗 Acessar Swagger UI / API Reference Local (http://localhost:3333/docs)](http://localhost:3333/docs)

---

### 2. Por que escolhemos essas tecnologias?

- **Fastify em vez de NestJS ou Express**
  **Escolha:** Fastify aliado à biblioteca Zod.
  **Motivo:** A Amazon é bem impaciente e derruba as Skills na Alexa que tentam pensar por mais de 8 segundos para responder algo. O Fastify é um microsserviço conhecido pela sua incrível velocidade e leveza. Isso garante que nunca percamos a resposta para um timeout. O Zod nos apoina garantindo as regras e o formato de dados que transacionam pelo código com facilidade.

- **Groq SDK em vez de OpenAI?**
  **Escolha:** IA conversacional e rápida rodando nos hardwares avançados da Groq.
  **Motivo:** Esperar três segundos após fazer uma pergunta para uma máquina costuma criar silencios frustrantes. A Groq fornece os maiores processamentos de LLMs de maneira quase instantânea, o que se torna um requisito essencial para uma conversação fluida baseada em voz e para obedecer o tempo curto de timeout que o back-end da API é exposto.

- **Drizzle ORM & Neon DB (PostgreSQL)**
  **Escolha:** Banco de dados serverless rápido aliado a um ORM 100% tipado.
  **Motivo:** Para manter uma "conversa contínua", a IA precisa do histórico recente. O Neon gerencia conexões HTTP ultrarrápidas nativas sem estourar o pool de banco, e o Drizzle traz segurança de tipos total (Type Safety) via TypeScript, garantindo gravações de memória da sessão e respostas no menor intervalo de milissegundos possíveis.

- **Arquitetura Modularizada**
  **Escolha:** Código muito bem separado por blocos de áreas responsáveis (Alexa vs. Groq).
  **Motivo:** Deixa o código fácil de ser atualizado ou escalado. Assim, se o provedor do Serviço de Inteligência Artificial mudar amanha, o nosso tratamento focado no tráfego das requisições com a Amazon não seria impactado por esse retrabalho.

---

### 3. Arquitetura do Projeto

```text
src/
├── app.ts                 # Configurações iniciais, plugins de segurança e inicialiadores
├── server.ts              # Arquivo principal que liga e divulga o servidor localmente
├── config/                # Gerenciamento seguro das variáveis de ambiente com o Zod (.env)
├── lib/                   
│   └── ai/                # Configuração de credenciais diretas do cliente da Groq (IA)
├── modules/               # Módulos funcionais focados numa única tarefa
│   ├── alexa              # Gerencia e compreende eventos disparados pela nuvem da Amazon (Intents)
│   ├── groq               # Manipulador de IA e injeta o histórico e contexto da conversa virtual
│   └── swagger            # Conector simples de design auto-gerado que monta a página de Docs
├── plugins/               # Index organizando os injetores gerais, como regras CORS.
├── prompts/               # Descrições fixas e comportamentais contendo "regras de persona da IA"
├── routes/                # Catalogador mestre que aponta as rotas publicadas na web
└── shared/                # O que for usado por todos (como as devoluções padrões de Erros)
```

**Como funciona o funil central das rotas:**
1. **Requisição** → O Payload em JSON disparada pela Skill preenchida.
2. **Validação** → Certifica-se perfeitamente o esqueleto de requisição, separando a Intenção livre ou do gatilho contido da estrutura de inicializaçāo sem crashar o código nativamente.
3. **Escuta Roteadora** → É enviada ao Serviço focado da Groq com um alarme temporizado de `6000ms`, um espaço protetivo até que demore demais.
4. **Responde com Fala (SSML)** → Após processada no Contexto conversacional com a IA, re-traduz o texto literal num markup purista adaptável de fala p/ o robô final com naturalidade.

---

### 4. Módulos Internos

#### Módulo: Alexa
Focado unicamente na Amazon AWS e na integridade do estado da conversa.
| Operação | Descrição |
|----------|-----------|
| Intents | Analisa intenções padrões enviadas (`LaunchRequest` ou Fechar Skill) e mapeia nossos comandos específicos abertos de AI. |
| Repositório | Interage com Postgres via Drizzle para salvar mensagens do usuário e consultar o log histórico e formar a "memória da conversa" da IA. |
| Renders | Utilitário responsável por injetar `<speak>` para deixar a mensagem no formato final de interpretação por áudio da Amazon. |
| Timeouts | Previne "silêncios eternos" injetando um gerador local de fallback caso a resposta global demore demais, salvaguardando a conexão no banco. |

#### Módulo: Groq
Fábrica de respostas conversacionais da IA.
| Operação | Descrição |
|----------|-----------|
| Dialog Analyzer | Puxa o arranjo lógico do que a máquina deve ser somado a um input atual do usuário para emular um chatbot linear em fala utilizando `llama-3.3-70b`. |

#### Módulo: Swagger
Documentação interativa.
| Operação | Descrição |
|----------|-----------|
| Layout Documental | A UI moderna (Scalar) unida aos checadores da Amazon de forma automática e visual. |

---

### 5. Variáveis de Ambiente (`.env`)

Crie o arquivo `.env` na pasta inicial baseando-se no cópia do `.env.example`. A API avisará ao ser iniciada caso encontre chaves e dependências desconfiguradas.

| Variável | Obrigt. | Descrição |
|----------|---------|-----------|
| `NODE_ENV` | ❌ | Modo ativo (`development` ou `production`) |
| `PORT` | ❌ | Define a porta onde a API está conectada. Padrão: 3333 |
| `HOST` | ❌ | IP principal nativo. Padrão `127.0.0.1` |
| `BASE_URL` | ❌ | Prefixo do ambiente inicial visível |
| `GROQ_API_KEY` | ✅ | Requisito: A chave privada de desenvolvedor para se integrar à LLM (Groq). |
| `DATABASE_URL` | ✅ | Requisito: String de conexão PostgreSQL (Neon) para armazenar histórico das conversas. |

---

### 6. Como Rodar Localmente

#### O que precisa ter instalado?
- Node.js (V24 em diante)
- pnpm (V10 em diante)

#### Instalação e Execução

```bash
# 1. Faça o clone do projeto para sua máquina local
git clone <repository-url>
cd alexa-cortex-api

# 2. Instale as bibliotecas vitais
pnpm install

# 3. Crie o arquivo seguro das senhas e cole o código obtido da API
cp .env.example .env
# Em .env defina GROQ_API_KEY=gsk__XXX...

# 4. Inicie o servidor observador 
pnpm dev

# Seu acesso web primário para API está em => http://127.0.0.1:3333
# Teste via interface OpenAPI/Swagger no link => http://localhost:3333/docs

# (Extra - Expor o projeto)
# Usando ngrok apontado para essa mesma porta pode conectar sua conta local direto no console 
# de desenvolvimento de Skills na nuvem em questão de segundos!
```

---

### 7. Comandos de Manutenção 

| Categoria | Comando | Descrição |
|-----------|---------|-----------|
| **Core** | `pnpm dev` | Inicia via visualizador `tsx` acompanhando e recarregando atualizações nas rotas instantâneamente. |
| **Build** | `pnpm build` | Minifica os arquivos e os isolam no formato otimizado estático sem depender do Node/Typescript local. |
| **Tipos** | `pnpm typecheck` | Processa um check-up silencioso para caçar dependências inconsistentes sem impactar a plataforma. |

---

### 8. Boas Práticas e Padrões de Contribuição Interna

- O nosso fluxo bloqueia replicação de códigos. Com a tipagem unida do **Fastify Type Provider e Zod**, definimos os atributos e exigências da interface da nossa API somente em um objeto Schema por vez.
- Entidades são agrupadas em blocos da mesma pasta (Exemplo de `routing` num `groq.service.ts` lado a lado dos Tipos de Chat) facilitando achar dependências locais com base nas nomenclaturas e sufixos padronizados.
