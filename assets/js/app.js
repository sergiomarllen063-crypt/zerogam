/* ==========================================================
   APP.JS
   ZEROGAME

   Funções:
   1. Mostrar músicas locais
   2. Pesquisar músicas locais
   3. Pesquisar músicas no YouTube
   4. Mostrar resultados do YouTube
   5. Controlar banner
   6. Atualizar ano do rodapé
========================================================== */


/* ==========================================================
   INICIALIZAÇÃO
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        iniciarCatalogo();

        iniciarYouTube();

        iniciarCarrossel();

        atualizarAno();

    }
);


/* ==========================================================
   ELEMENTOS
========================================================== */

const musicGrid =
    document.getElementById("musicGrid");

const searchInput =
    document.getElementById("searchInput");

const musicCount =
    document.getElementById("musicCount");

const noResults =
    document.getElementById("noResults");

const currentYear =
    document.getElementById("currentYear");


/* ==========================================================
   YOUTUBE
========================================================== */

const youtubeInitial =
    document.getElementById("spotifyInitial");

const youtubeLoading =
    document.getElementById("spotifyLoading");

const youtubeResults =
    document.getElementById("spotifyResults");

const youtubeNoResults =
    document.getElementById("spotifyNoResults");

const youtubeError =
    document.getElementById("spotifyError");


/* ==========================================================
   SEGURANÇA
   Escapa HTML antes de colocar dados na página.
========================================================== */

function escapeHTML(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ==========================================================
   CATÁLOGO LOCAL
========================================================== */

function iniciarCatalogo() {

    if (!Array.isArray(musicas)) {

        console.error(
            "A variável 'musicas' não foi encontrada."
        );

        return;
    }


    renderizarMusicas(musicas);


    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        function () {

            const termo =
                searchInput.value
                    .trim()
                    .toLowerCase();


            pesquisarMusicasLocais(termo);

        }
    );

}


/* ==========================================================
   PESQUISAR MÚSICAS LOCAIS
========================================================== */

function pesquisarMusicasLocais(termo) {

    if (!termo) {

        renderizarMusicas(musicas);

        return;
    }


    const resultados =
        musicas.filter(
            function (musica) {

                const titulo =
                    String(musica.titulo || "")
                        .toLowerCase();

                const artista =
                    String(musica.artista || "")
                        .toLowerCase();

                const genero =
                    String(musica.genero || "")
                        .toLowerCase();

                const descricao =
                    String(musica.descricao || "")
                        .toLowerCase();


                return (
                    titulo.includes(termo) ||
                    artista.includes(termo) ||
                    genero.includes(termo) ||
                    descricao.includes(termo)
                );

            }
        );


    renderizarMusicas(resultados);

}


/* ==========================================================
   RENDERIZAR MÚSICAS LOCAIS
========================================================== */

function renderizarMusicas(lista) {

    if (!musicGrid) {
        return;
    }


    musicGrid.innerHTML = "";


    if (musicCount) {

        musicCount.textContent =
            lista.length;

    }


    if (lista.length === 0) {

        if (noResults) {
            noResults.hidden = false;
        }

        return;
    }


    if (noResults) {
        noResults.hidden = true;
    }


    lista.forEach(
        function (musica) {

            const card =
                document.createElement("article");


            card.className =
                "music-card";


            card.innerHTML = `

                <div class="music-cover">

                    <img
                        src="${escapeHTML(musica.capa)}"
                        alt="Capa de ${escapeHTML(musica.titulo)}"
                        loading="lazy"
                    >

                </div>


                <div class="music-info">

                    <h3>
                        ${escapeHTML(musica.titulo)}
                    </h3>


                    <p class="music-artist">

                        ${escapeHTML(musica.artista)}

                    </p>


                    <p class="music-description">

                        ${escapeHTML(musica.descricao || "")}

                    </p>


                    <audio
                        controls
                        preload="none"
                    >

                        <source
                            src="${escapeHTML(musica.arquivo)}"
                            type="audio/mpeg"
                        >

                        O teu navegador não suporta áudio.

                    </audio>


                    <div class="music-actions">

                        <a
                            href="${escapeHTML(musica.arquivo)}"
                            download
                            class="btn-download"
                        >
                            ⬇ Baixar
                        </a>


                        <a
                            href="musica.html?id=${encodeURIComponent(musica.id)}"
                            class="btn-view"
                        >
                            Ver
                        </a>

                    </div>

                </div>

            `;


            musicGrid.appendChild(card);

        }
    );

}


/* ==========================================================
   YOUTUBE
========================================================== */

function iniciarYouTube() {

    if (!searchInput) {
        return;
    }


    let timer = null;


    searchInput.addEventListener(
        "input",
        function () {

            clearTimeout(timer);


            const termo =
                searchInput.value.trim();


            /*
                Se estiver vazio,
                voltamos ao estado inicial.
            */

            if (termo.length === 0) {

                limparYouTube();

                return;
            }


            /*
                Evita chamadas à API a cada tecla.
            */

            if (termo.length < 2) {
                return;
            }


            timer =
                setTimeout(
                    function () {

                        pesquisarYouTube(termo);

                    },
                    600
                );

        }
    );

}


/* ==========================================================
   PESQUISAR NO YOUTUBE
========================================================== */

async function pesquisarYouTube(termo) {

    mostrarYouTubeLoading();


    try {

        const resposta =
            await fetch(
                `/.netlify/functions/youtube-search?q=${encodeURIComponent(termo)}`
            );


        if (!resposta.ok) {

            const erroAPI =
                await resposta.json().catch(
                    function () {
                        return {};
                    }
                );


            console.error(
                "Erro retornado pelo YouTube:",
                erroAPI
            );


            throw new Error(
                "Erro na função YouTube."
            );

        }


        const dados =
            await resposta.json();


        if (
            !dados ||
            !Array.isArray(dados.resultados)
        ) {

            throw new Error(
                "Resposta inválida do YouTube."
            );

        }


        if (dados.resultados.length === 0) {

            mostrarYouTubeSemResultados();

            return;
        }


        renderizarYouTube(
            dados.resultados
        );

    }


    catch (erro) {

        console.error(
            "YouTube:",
            erro
        );


        mostrarYouTubeErro();

    }

}


/* ==========================================================
   MOSTRAR CARREGANDO
========================================================== */

function mostrarYouTubeLoading() {

    if (youtubeInitial) {
        youtubeInitial.hidden = true;
    }

    if (youtubeNoResults) {
        youtubeNoResults.hidden = true;
    }

    if (youtubeError) {
        youtubeError.hidden = true;
    }

    if (youtubeResults) {
        youtubeResults.innerHTML = "";
    }

    if (youtubeLoading) {
        youtubeLoading.hidden = false;
    }

}


/* ==========================================================
   RENDERIZAR YOUTUBE
========================================================== */

function renderizarYouTube(lista) {

    if (youtubeInitial) {
        youtubeInitial.hidden = true;
    }

    if (youtubeLoading) {
        youtubeLoading.hidden = true;
    }

    if (youtubeNoResults) {
        youtubeNoResults.hidden = true;
    }

    if (youtubeError) {
        youtubeError.hidden = true;
    }


    if (!youtubeResults) {
        return;
    }


    youtubeResults.innerHTML = "";


    lista.forEach(
        function (musica) {

            const card =
                document.createElement("article");


            card.className =
                "music-card spotify-card";


            card.innerHTML = `

                <div class="spotify-cover">

                    <img
                        src="${escapeHTML(musica.capa)}"
                        alt="Capa de ${escapeHTML(musica.titulo)}"
                        loading="lazy"
                    >

                </div>


                <div class="music-info">

                    <h3>
                        ${escapeHTML(musica.titulo)}
                    </h3>


                    <p class="music-artist">

                        ${escapeHTML(
                            musica.canal || "YouTube"
                        )}

                    </p>


                    <p class="music-description">

                        ${escapeHTML(
                            musica.descricao ||
                            "Vídeo disponível no YouTube."
                        )}

                    </p>


                    <div class="music-actions">

                        <a
                            href="${escapeHTML(musica.url)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="btn-spotify"
                        >
                            ▶ Ouvir no YouTube
                        </a>

                    </div>

                </div>

            `;


            youtubeResults.appendChild(card);

        }
    );


    /*
        Levar o usuário para a seção
        dos resultados do YouTube.
    */

    const secaoYouTube =
        document.getElementById("youtube");


    if (secaoYouTube) {

        secaoYouTube.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


/* ==========================================================
   SEM RESULTADOS YOUTUBE
========================================================== */

function mostrarYouTubeSemResultados() {

    if (youtubeInitial) {
        youtubeInitial.hidden = true;
    }

    if (youtubeLoading) {
        youtubeLoading.hidden = true;
    }

    if (youtubeError) {
        youtubeError.hidden = true;
    }

    if (youtubeResults) {
        youtubeResults.innerHTML = "";
    }

    if (youtubeNoResults) {
        youtubeNoResults.hidden = false;
    }

}


/* ==========================================================
   ERRO YOUTUBE
========================================================== */

function mostrarYouTubeErro() {

    if (youtubeInitial) {
        youtubeInitial.hidden = true;
    }

    if (youtubeLoading) {
        youtubeLoading.hidden = true;
    }

    if (youtubeNoResults) {
        youtubeNoResults.hidden = true;
    }

    if (youtubeResults) {
        youtubeResults.innerHTML = "";
    }

    if (youtubeError) {
        youtubeError.hidden = false;
    }

}


/* ==========================================================
   LIMPAR YOUTUBE
========================================================== */

function limparYouTube() {

    if (youtubeLoading) {
        youtubeLoading.hidden = true;
    }

    if (youtubeNoResults) {
        youtubeNoResults.hidden = true;
    }

    if (youtubeError) {
        youtubeError.hidden = true;
    }

    if (youtubeResults) {
        youtubeResults.innerHTML = "";
    }

    if (youtubeInitial) {
        youtubeInitial.hidden = false;
    }

}


/* ==========================================================
   CARROSSEL DO BANNER
========================================================== */

function iniciarCarrossel() {

    const slides =
        document.querySelectorAll(
            ".hero-slide"
        );


    const dotsContainer =
        document.getElementById(
            "heroDots"
        );


    const prevButton =
        document.getElementById(
            "heroPrev"
        );


    const nextButton =
        document.getElementById(
            "heroNext"
        );


    if (
        slides.length === 0 ||
        !dotsContainer
    ) {

        return;
    }


    let currentSlide = 0;

    let interval;


    /*
        Criar indicadores automaticamente.
    */

    slides.forEach(
        function (_, index) {

            const dot =
                document.createElement("button");


            dot.className =
                "hero-dot";


            dot.type =
                "button";


            dot.setAttribute(
                "aria-label",
                `Banner ${index + 1}`
            );


            dot.addEventListener(
                "click",
                function () {

                    mostrarSlide(index);

                    reiniciarCarrossel();

                }
            );


            dotsContainer.appendChild(dot);

        }
    );


    const dots =
        dotsContainer.querySelectorAll(
            ".hero-dot"
        );


    /*
        Mostrar slide
    */

    function mostrarSlide(index) {

        if (
            index >= slides.length
        ) {

            index = 0;

        }


        if (index < 0) {

            index =
                slides.length - 1;

        }


        slides.forEach(
            function (slide) {

                slide.classList.remove(
                    "active"
                );

            }
        );


        dots.forEach(
            function (dot) {

                dot.classList.remove(
                    "active"
                );

            }
        );


        slides[index]
            .classList
            .add("active");


        if (dots[index]) {

            dots[index]
                .classList
                .add("active");

        }


        currentSlide =
            index;

    }


    /*
        Próximo
    */

    function proximoSlide() {

        mostrarSlide(
            currentSlide + 1
        );

    }


    /*
        Anterior
    */

    function slideAnterior() {

        mostrarSlide(
            currentSlide - 1
        );

    }


    /*
        Reiniciar automático
    */

    function reiniciarCarrossel() {

        clearInterval(interval);


        interval =
            setInterval(
                function () {

                    proximoSlide();

                },
                5000
            );

    }


    /*
        Botão próximo
    */

    if (nextButton) {

        nextButton.addEventListener(
            "click",
            function () {

                proximoSlide();

                reiniciarCarrossel();

            }
        );

    }


    /*
        Botão anterior
    */

    if (prevButton) {

        prevButton.addEventListener(
            "click",
            function () {

                slideAnterior();

                reiniciarCarrossel();

            }
        );

    }


    /*
        Iniciar
    */

    mostrarSlide(0);

    reiniciarCarrossel();

}


/* ==========================================================
   ANO AUTOMÁTICO
========================================================== */

function atualizarAno() {

    if (currentYear) {

        currentYear.textContent =
            new Date().getFullYear();

    }

}