const LARGURA = 15
const ALTURA = 15
const TOTAL = LARGURA * ALTURA
const LINHA_DA_NAVE = ALTURA - 2
const MS_POR_TICK = 100   
const VIDAS_INICIAIS = 3
const RECARGA_TICKS = 4       
const EXPLOSAO_TICKS = 3      
const CHAVE_RECORDE = 'space-invaders:recorde'

// Elementos do DOM
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

// Estado do jogo
function criarInvasores()
{
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
        nave: LINHA_DA_NAVE * LARGURA + Math.floor(LARGURA / 2),
        invasores: criarInvasores(),
        direcao: 1,             
        tiros: [],                    
        tirosInimigos: [],
        explosoes: new Map(),        
        pontos: 0,
        vidas: VIDAS_INICIAIS,
        recarga: 0,
        tick: 0,
        contadorInvasores: 6,
        status: 'jogando',       
    }
}

let estado = novoEstado()

//Regras
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

function resolverColisoes()
{
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

    const antes = estado.tirosInimigos.length
    estado.tirosInimigos = estado.tirosInimigos.filter(t => t !== estado.nave)
    if (estado.tirosInimigos.length < antes) perderVida()

    if (estado.invasores.some(i => i >= LINHA_DA_NAVE * LARGURA)) terminar('derrota')

    if (estado.invasores.length === 0) terminar('vitoria')
}

function intervaloDosInvasores()
{
    return Math.max(2, Math.ceil(estado.invasores.length / 5))
}

function moverInvasores()
{
    const colunas = estado.invasores.map(i => i % LARGURA)
    const naBordaDireita = estado.direcao === 1 && colunas.includes(LARGURA - 1)
    const naBordaEsquerda = estado.direcao === -1 && colunas.includes(0)

    if (naBordaDireita || naBordaEsquerda)
    {
        estado.invasores = estado.invasores.map(i => i + LARGURA)
        estado.direcao *= -1                                     
    }
    else
    {
        estado.invasores = estado.invasores.map(i => i + estado.direcao)
    }
}

function invasorAtira()
{
    if (estado.invasores.length === 0) return

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

function tick()
{
    if (estado.status !== 'jogando') return

    estado.tick++
    if (estado.recarga > 0) estado.recarga--
    envelhecerExplosoes()

    estado.tiros = estado.tiros.map(t => t - LARGURA).filter(t => t >= 0)
    resolverColisoes()

    if (estado.tick % 2 === 0)
    {
        estado.tirosInimigos = estado.tirosInimigos
            .map(t => t + LARGURA)
            .filter(t => t < TOTAL)
        resolverColisoes()
    }

    estado.contadorInvasores--
    if (estado.contadorInvasores <= 0)
    {
        moverInvasores()
        estado.contadorInvasores = intervaloDosInvasores()
        resolverColisoes()
    }

    if (estado.tick % 10 === 0)
    {
        invasorAtira()
        resolverColisoes()
    }

    desenhar()
}

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

document.addEventListener('visibilitychange', () =>
{
    if (document.hidden && estado.status === 'jogando')
    {
        estado.status = 'pausado'
        desenhar()
    }
})

desenhar()
setInterval(tick, MS_POR_TICK)
