// ============================================================
//  Space Invaders - versão 2
//
//  Ideia central: o jogo inteiro vive em UM objeto (`estado`).
//  A cada mudança, a função desenhar() redesenha a tela inteira
//  a partir desse objeto. Assim nunca sobra "lixo" na tela e
//  fica fácil de entender o que está acontecendo.
// ============================================================

// ---------- Configurações ----------
const LARGURA = 15
const ALTURA = 15
const TOTAL = LARGURA * ALTURA
const LINHA_DA_NAVE = ALTURA - 2
const MS_POR_TICK = 100        // o "relógio" do jogo: 1 tick = 100 ms
const VIDAS_INICIAIS = 3
const RECARGA_TICKS = 4        // tempo mínimo entre dois tiros do jogador
const EXPLOSAO_TICKS = 3       // quanto tempo a explosão fica na tela
const CHAVE_RECORDE = 'space-invaders:recorde'

// ---------- Elementos do DOM ----------
const grid = document.querySelector('.grid')
const pontosEl = document.querySelector('#pontos')
const recordeEl = document.querySelector('#recorde')
const vidasEl = document.querySelector('#vidas')
const mensagemEl = document.querySelector('#mensagem')

const quadrados = Array.from({ length: TOTAL }, () =>
{
    const quadrado = document.createElement('div')
    grid.appendChild(quadrado)
    return quadrado
})

const MENSAGENS = {
    jogando: '',
    pausado: 'PAUSADO - pressione P para continuar',
    vitoria: 'VOCÊ VENCEU! Pressione Enter para jogar de novo',
    derrota: 'GAME OVER - pressione Enter para jogar de novo',
}

// ---------- Recorde (guardado no navegador) ----------
function lerRecorde()
{
    try { return Number(localStorage.getItem(CHAVE_RECORDE)) || 0 }
    catch { return 0 }
}

function salvarRecorde(valor)
{
    try { localStorage.setItem(CHAVE_RECORDE, String(valor)) }
    catch { /* sem localStorage? tudo bem, só não guarda */ }
}

let recorde = lerRecorde()

// ---------- Estado do jogo ----------
function criarInvasores()
{
    // 3 linhas de 10 invasores, igual ao original (0..9, 15..24, 30..39)
    const invasores = []
    for (let linha = 0; linha < 3; linha++)
    {
        for (let coluna = 0; coluna < 10; coluna++)
        {
            invasores.push(linha * LARGURA + coluna)
        }
    }
    return invasores
}

function novoEstado()
{
    return {
        nave: LINHA_DA_NAVE * LARGURA + Math.floor(LARGURA / 2), // = 202, como no original
        invasores: criarInvasores(),   // só os que estão VIVOS
        direcao: 1,                    // 1 = direita, -1 = esquerda
        tiros: [],                     // tiros do jogador
        tirosInimigos: [],
        explosoes: new Map(),          // posição -> ticks restantes
        pontos: 0,
        vidas: VIDAS_INICIAIS,
        recarga: 0,
        tick: 0,
        contadorInvasores: 6,
        status: 'jogando',             // 'jogando' | 'pausado' | 'vitoria' | 'derrota'
    }
}

let estado = novoEstado()

// ---------- Regras ----------
function terminar(resultado)
{
    if (estado.status !== 'jogando') return
    estado.status = resultado

    if (estado.pontos > recorde)
    {
        recorde = estado.pontos
        salvarRecorde(recorde)
    }
}

function perderVida()
{
    estado.vidas--
    if (estado.vidas <= 0) terminar('derrota')
}

function moverNave(delta)
{
    const coluna = estado.nave % LARGURA
    if (delta === -1 && coluna === 0) return
    if (delta === 1 && coluna === LARGURA - 1) return
    estado.nave += delta
}

function atirar()
{
    if (estado.recarga > 0) return // impede metralhadora ao segurar a tecla
    estado.tiros.push(estado.nave - LARGURA)
    estado.recarga = RECARGA_TICKS
}

// Em vez de só olhar a colisão quando o tiro anda, olhamos depois de
// QUALQUER movimento. Assim, ninguém "atravessa" ninguém.
function resolverColisoes()
{
    // Tiros do jogador x invasores
    estado.tiros = estado.tiros.filter(tiro =>
    {
        const acertou = estado.invasores.includes(tiro)
        if (acertou)
        {
            estado.invasores = estado.invasores.filter(i => i !== tiro)
            estado.pontos += 10
            estado.explosoes.set(tiro, EXPLOSAO_TICKS)
        }
        return !acertou
    })

    // Tiros inimigos x nave
    const antes = estado.tirosInimigos.length
    estado.tirosInimigos = estado.tirosInimigos.filter(t => t !== estado.nave)
    if (estado.tirosInimigos.length < antes) perderVida()

    // Invasores chegaram na linha da nave
    if (estado.invasores.some(i => i >= LINHA_DA_NAVE * LARGURA)) terminar('derrota')

    // Todos eliminados
    if (estado.invasores.length === 0) terminar('vitoria')
}

function intervaloDosInvasores()
{
    // Quanto menos invasores, mais rápido eles andam (mínimo: a cada 2 ticks)
    return Math.max(2, Math.ceil(estado.invasores.length / 5))
}

function moverInvasores()
{
    // As bordas são calculadas só com os invasores vivos
    const colunas = estado.invasores.map(i => i % LARGURA)
    const naBordaDireita = estado.direcao === 1 && colunas.includes(LARGURA - 1)
    const naBordaEsquerda = estado.direcao === -1 && colunas.includes(0)

    if (naBordaDireita || naBordaEsquerda)
    {
        estado.invasores = estado.invasores.map(i => i + LARGURA) // desce uma linha
        estado.direcao *= -1                                      // e inverte
    }
    else
    {
        estado.invasores = estado.invasores.map(i => i + estado.direcao)
    }
}

function invasorAtira()
{
    if (estado.invasores.length === 0) return

    // Só o invasor mais baixo de cada coluna pode atirar
    const maisBaixoPorColuna = new Map()
    for (const i of estado.invasores)
    {
        const coluna = i % LARGURA
        if (!maisBaixoPorColuna.has(coluna) || i > maisBaixoPorColuna.get(coluna))
        {
            maisBaixoPorColuna.set(coluna, i)
        }
    }

    const atiradores = Array.from(maisBaixoPorColuna.values())
    const escolhido = atiradores[Math.floor(Math.random() * atiradores.length)]
    const posicao = escolhido + LARGURA
    if (posicao < TOTAL) estado.tirosInimigos.push(posicao)
}

function envelhecerExplosoes()
{
    for (const [posicao, restante] of estado.explosoes)
    {
        if (restante <= 1) estado.explosoes.delete(posicao)
        else estado.explosoes.set(posicao, restante - 1)
    }
}

// ---------- Um "tick" do jogo ----------
function tick()
{
    if (estado.status !== 'jogando') return

    estado.tick++
    if (estado.recarga > 0) estado.recarga--
    envelhecerExplosoes()

    // 1) Tiros do jogador sobem 1 casa por tick (e somem ao sair da tela)
    estado.tiros = estado.tiros.map(t => t - LARGURA).filter(t => t >= 0)
    resolverColisoes()

    // 2) Tiros inimigos descem 1 casa a cada 2 ticks
    if (estado.tick % 2 === 0)
    {
        estado.tirosInimigos = estado.tirosInimigos
            .map(t => t + LARGURA)
            .filter(t => t < TOTAL)
        resolverColisoes()
    }

    // 3) Invasores andam (cada vez mais rápido)
    estado.contadorInvasores--
    if (estado.contadorInvasores <= 0)
    {
        moverInvasores()
        estado.contadorInvasores = intervaloDosInvasores()
        resolverColisoes()
    }

    // 4) De tempos em tempos, um invasor atira
    if (estado.tick % 10 === 0)
    {
        invasorAtira()
        resolverColisoes()
    }

    desenhar()
}

// ---------- Desenho ----------
function desenhar()
{
    for (const quadrado of quadrados) quadrado.className = ''

    estado.invasores.forEach(i => quadrados[i]?.classList.add('alienpericuloso'))
    estado.tiros.forEach(i => quadrados[i]?.classList.add('tiros'))
    estado.tirosInimigos.forEach(i => quadrados[i]?.classList.add('tiro-inimigo'))
    estado.explosoes.forEach((_, i) => quadrados[i]?.classList.add('boom'))
    quadrados[estado.nave].classList.add('navezona')

    pontosEl.textContent = estado.pontos
    recordeEl.textContent = Math.max(recorde, estado.pontos)
    vidasEl.textContent = '♥ '.repeat(Math.max(0, estado.vidas)).trim() || '-'
    mensagemEl.textContent = MENSAGENS[estado.status]
}

// ---------- Controles ----------
function reiniciar()
{
    estado = novoEstado()
    desenhar()
}

function alternarPausa()
{
    if (estado.status === 'jogando') estado.status = 'pausado'
    else if (estado.status === 'pausado') estado.status = 'jogando'
    desenhar()
}

document.addEventListener('keydown', (e) =>
{
    // Impede a página de rolar com as setas e o espaço
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) e.preventDefault()

    if (e.key === 'Enter' && (estado.status === 'vitoria' || estado.status === 'derrota'))
    {
        reiniciar()
        return
    }

    if (e.key.toLowerCase() === 'p')
    {
        alternarPausa()
        return
    }

    if (estado.status !== 'jogando') return

    switch (e.key)
    {
        case 'ArrowLeft':
            moverNave(-1)
            break
        case 'ArrowRight':
            moverNave(1)
            break
        case 'ArrowUp':
        case ' ':
            atirar()
            break
        default:
            return
    }

    resolverColisoes()
    desenhar()
})

// Pausa sozinho se você trocar de aba
document.addEventListener('visibilitychange', () =>
{
    if (document.hidden && estado.status === 'jogando')
    {
        estado.status = 'pausado'
        desenhar()
    }
})

// ---------- Começa o jogo ----------
desenhar()
setInterval(tick, MS_POR_TICK)
