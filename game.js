// Variaveis 
const grid = document.querySelector('.grid')
const resultsDisplay = document.querySelector('.results')
let currentNavezonaIndex = 202
const width = 15
const invasoresRemovidos = []
let direcao = 1
let InvasoresId
let indoparaDireita = true
let results = 0

//Criar Oponentes
for(let i = 0; i < width * width; i++)
{
    const quadrado = document.createElement('div')
    grid.appendChild(quadrado)
}

const quadrados = Array.from(document.querySelectorAll('.grid div'))

const Invasores = 
[
    0,1,2,3,4,5,6,7,8,9,
    15,16,17,18,19,20,21,22,23,24,
    30,31,32,33,34,35,36,37,38,39
]

//Exibir Oponentes
function draw()
{
    for (let i = 0; i < Invasores.length; i++)
    {
        if(!invasoresRemovidos.includes(i)) 
        {
            quadrados[Invasores[i]].classList.add('alienpericuloso')
        }
    }
}

draw()

//Evaporação dos inimigos
function remove()
{
    for (let i = 0; i < Invasores.length; i++)
    {
        quadrados[Invasores[i]].classList.remove('alienpericuloso')
    }
}

//Criar Player
quadrados[currentNavezonaIndex].classList.add('navezona')

//Movimentação do Player
function moverNavezona(e)
{
    quadrados[currentNavezonaIndex].classList.remove('navezona')
    switch(e.key)
    {
        case'ArrowLeft' :
            if (currentNavezonaIndex % width !== 0) currentNavezonaIndex -=1
            break
        case'ArrowRight' :
        if (currentNavezonaIndex % width < width -1) currentNavezonaIndex +=1
        break
    }
    quadrados[currentNavezonaIndex].classList.add('navezona')
}
document.addEventListener('keydown', moverNavezona)

//Movimentação dos Inimigos
function moverAliens()
{
    const CantoEsquerdo = Invasores[0] % width === 0
    const CantoDireito = Invasores[Invasores.length - 1] % width === width -1
    remove()

    if (CantoDireito && indoparaDireita)
    {
        for(let i = 0; i < Invasores.length; i++)
        {
            Invasores[i] += width +1
            direcao = -1
            indoparaDireita = false
        }
    }

    if (CantoEsquerdo && !indoparaDireita)
    {
        for (let i = 0; i < Invasores.length; i++)
        {
            Invasores[i] += width -1
            direcao = 1 
            indoparaDireita = true
        }
    }

    for (let i = 0; i < Invasores.length; i++)
    {
        Invasores[i] += direcao
    }

    draw()

//Game Over
    if(quadrados[currentNavezonaIndex].classList.contains('alienpericuloso', 'navezona'))
    {
        resultsDisplay.innerHTML = 'GAME OVER'
        clearInterval(InvasoresId)
    }

    if(invasoresRemovidos.length === Invasores.length)
    {
        resultsDisplay.innerHTML = 'YOU WIN'  
        clearInterval(InvasoresId)
    } 

}
InvasoresId = setInterval(moverAliens, 600)

//Tiros
function shoot(e)
{
    let tirosId
    let currentTirosIndex = currentNavezonaIndex

    function moverTiros()
    {
        quadrados[currentTirosIndex].classList.remove('tiros')
        currentTirosIndex -= width
        quadrados[currentTirosIndex].classList.add('tiros')

        if(quadrados[currentTirosIndex].classList.contains('alienpericuloso'))
        {
            quadrados[currentTirosIndex].classList.remove('tiros')
            quadrados[currentTirosIndex].classList.remove('alienpericuloso')
            quadrados[currentTirosIndex].classList.add('boom')

            setTimeout(() => quadrados[currentTirosIndex].classList.remove('boom'), 300)
            clearInterval(tirosId)

            const alienRemovido = Invasores.indexOf(currentTirosIndex)
            invasoresRemovidos.push(alienRemovido)
            results++
            resultsDisplay.innerHTML = results
            console.log(invasoresRemovidos)
        }
    }

    switch(e.key)
    {
        case 'ArrowUp':
           tirosId = setInterval(moverTiros, 100)
        break
    }
}



document.addEventListener('keydown', shoot)