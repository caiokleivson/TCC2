import http from 'k6/http';
import { check, sleep } from 'k6';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO — altere apenas esta linha para trocar de API
// Valores válidos: 'claude' | 'gpt' | 'gemini'
// ═══════════════════════════════════════════════════════════════════════════
const API = 'claude';

// ── Mapeamento das diferenças entre APIs ─────────────────────────────────
const CONFIGS = {

  claude: {
    base:             'http://localhost:3000',
    prefix:           '/api/v1',       // todas as rotas vivem em /api/v1
    login:            '/auth/login',
    users:            '/users',
    // Claude não tem registro público — admin cria o usuário
    requiresAdmin:    true,
    admin:            { email: 'alice@exemplo.com', password: 'Admin@123456' },
    // Login retorna { accessToken, user }
    getToken:         (r) => r.json('accessToken'),
    // createUser (admin) retorna { data: { id, ... } }
    getCreatedId:     (r) => r.json('data.id'),
  },

  gpt: {
    base:             'http://localhost:3000',
    prefix:           '',
    register:         '/auth/register',
    login:            '/auth/login',
    users:            '/users',
    requiresAdmin:    false,
    // Login retorna { token }
    getToken:         (r) => r.json('token'),
    // register retorna o objeto user direto: { id, name, email, ... }
    getCreatedId:     (r) => r.json('id'),
  },

  gemini: {
    base:             'http://localhost:3000',
    prefix:           '',
    register:         '/api/users/register',
    login:            '/api/users/login',
    users:            '/api/users',
    requiresAdmin:    false,
    // Login retorna { token, user }
    getToken:         (r) => r.json('token'),
    // register retorna o objeto user direto: { id, name, email, ... }
    getCreatedId:     (r) => r.json('id'),
  },
};

const C       = CONFIGS[API];
const HEADERS = { 'Content-Type': 'application/json' };
const url     = (path) => `${C.base}${C.prefix}${path}`;

// ── Parâmetros do teste ───────────────────────────────────────────────────
export const options = {
  vus:      5,
  duration: '20s',
};

// ═══════════════════════════════════════════════════════════════════════════
// SETUP — roda UMA vez antes de todos os VUs
// Usado apenas pelo Claude para obter o token de admin
// ═══════════════════════════════════════════════════════════════════════════
export function setup() {
  if (!C.requiresAdmin) return null;

  const res = http.post(
    url(C.login),
    JSON.stringify({ email: C.admin.email, password: C.admin.password }),
    { headers: HEADERS }
  );

  if (res.status !== 200) {
    console.error(`[SETUP] Falha no login admin: HTTP ${res.status} — ${res.body}`);
    return null;
  }

  const adminToken = C.getToken(res);
  console.log('[SETUP] Login admin OK — token obtido com sucesso');
  return { adminToken };
}

// ═══════════════════════════════════════════════════════════════════════════
// FLUXO PRINCIPAL — 4 requisições idênticas para as 3 APIs
// ═══════════════════════════════════════════════════════════════════════════
export default function (data) {
  const uid      = `${Date.now()}_${__VU}_${__ITER}`;
  const email    = `teste${uid}@exemplo.com`;
  const password = 'Senha@123';
  const name     = `Teste_VU${__VU}`;

  let userId;
  let userToken;

  // ── ETAPA 1: CRIAR USUÁRIO ──────────────────────────────────────────────

  if (C.requiresAdmin) {
    // Claude: admin cria o usuário via POST /api/v1/users
    const adminHeaders = {
      ...HEADERS,
      Authorization: `Bearer ${data.adminToken}`,
    };

    const createRes = http.post(
      url(C.users),
      JSON.stringify({ name, email, password }),
      { headers: adminHeaders }
    );

    const criado = check(createRes, {
      '✅ Usuário criado com sucesso': (r) => r.status === 201,
    });

    if (!criado) return;
    userId = C.getCreatedId(createRes);

  } else {
    // GPT / Gemini: registro público
    const regRes = http.post(
      url(C.register),
      JSON.stringify({ name, email, password }),
      { headers: HEADERS }
    );

    const registrado = check(regRes, {
      '✅ Usuário criado com sucesso': (r) => r.status === 201,
    });

    if (!registrado) return;
    userId = C.getCreatedId(regRes);
  }

  // ── ETAPA 2: LOGIN ──────────────────────────────────────────────────────
  const loginRes = http.post(
    url(C.login),
    JSON.stringify({ email, password }),
    { headers: HEADERS }
  );

  check(loginRes, {
    '✅ Login funcionando':   (r) => r.status === 200,
    '✅ Login retorna token': (r) => !!C.getToken(r),
  });

  if (loginRes.status !== 200) return;
  userToken = C.getToken(loginRes);

  const authHeaders = { ...HEADERS, Authorization: `Bearer ${userToken}` };

  // ── ETAPA 3: LEITURA DO PERFIL ──────────────────────────────────────────
  const profileRes = http.get(
    url(`${C.users}/${userId}`),
    { headers: authHeaders }
  );

  check(profileRes, {
    '✅ Perfil acessado com sucesso': (r) => r.status === 200,
    '✅ Retorna dados do usuário':    (r) => r.status === 200 && r.body.length > 0,
  });

  // ── ETAPA 4: ATUALIZAÇÃO DO PERFIL ──────────────────────────────────────
  const updateRes = http.put(
    url(`${C.users}/${userId}`),
    JSON.stringify({ name: `Atualizado_${uid}` }),
    { headers: authHeaders }
  );

  check(updateRes, {
    '✅ Perfil atualizado com sucesso': (r) => r.status === 200,
  });

  sleep(1);
}
