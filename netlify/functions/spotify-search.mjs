
/* ==========================================================
   SPOTIFY SEARCH
   Netlify Function

   Esta função:

   1. Recebe uma pesquisa do navegador.
   2. Obtém um token do Spotify.
   3. Pesquisa músicas.
   4. Devolve somente os dados necessários ao site.

   IMPORTANTE:

   SPOTIFY_CLIENT_ID
   SPOTIFY_CLIENT_SECRET

   ficam nas variáveis de ambiente do Netlify.

   NÃO colocar essas informações neste arquivo.
========================================================== */


/* ==========================================================
   CACHE DO TOKEN
========================================================== */

let spotifyToken = null;

let spotifyTokenExpiration = 0;



/* ==========================================================
   CABEÇALHOS
========================================================== */

const headers = {

    "Content-Type":
        "application/json",

    "Cache-Control":
        "public, max-age=60"

};



/* ==========================================================
   FUNÇÃO PRINCIPAL
========================================================== */

export default async function handler(request) {


    /*
        Só aceitamos GET.
    */

    if (request.method !== "GET") {

        return {

            statusCode: 405,

            headers,

            body: JSON.stringify({

                error:
                    "Método não permitido."

            })

        };

    }



    /*
        Ler pesquisa.
    */

    const url =
        new URL(
            request.url
        );


    const query =
        url.searchParams
            .get("q")
            ?.trim();



    /*
        Verificar pesquisa.
    */

    if (!query) {

        return {

            statusCode: 400,

            headers,

            body: JSON.stringify({

                error:
                    "Digite uma música ou artista."

            })

        };

    }



    /*
        Limitar tamanho da pesquisa.
    */

    if (query.length > 100) {

        return {

            statusCode: 400,

            headers,

            body: JSON.stringify({

                error:
                    "Pesquisa muito longa."

            })

        };

    }



    try {


        /* ==================================================
           OBTER TOKEN
        ================================================== */

        const token =
            await getSpotifyToken();



        /* ==================================================
           PESQUISAR SPOTIFY
        ================================================== */

        const spotifyURL =
            new URL(
                "https://api.spotify.com/v1/search"
            );


        spotifyURL.searchParams.set(
            "q",
            query
        );


        spotifyURL.searchParams.set(
            "type",
            "track"
        );


        spotifyURL.searchParams.set(
            "limit",
            "12"
        );


        /*
            Mercado.

            AO = Angola.
        */

        spotifyURL.searchParams.set(
            "market",
            "AO"
        );



        const response =
            await fetch(
                spotifyURL,
                {

                    method:
                        "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

                }
            );



        /*
            Se o Spotify devolver erro.
        */

        if (!response.ok) {

            const erro =
                await response.text();


            console.error(
                "Spotify API:",
                erro
            );


            return {

                statusCode:
                    response.status,

                headers,

                body:
                    JSON.stringify({

                        error:
                            "Erro ao consultar Spotify."

                    })

            };

        }



        const data =
            await response.json();



        /*
            Transformar a resposta
            num formato simples.
        */

        const tracks =
            Array.isArray(
                data.tracks?.items
            )
                ? data.tracks.items.map(
                    function (track) {

                        return {

                            id:
                                track.id,

                            titulo:
                                track.name,

                            artistas:
                                Array.isArray(
                                    track.artists
                                )
                                    ? track.artists.map(
                                        artist =>
                                            artist.name
                                    )
                                    : [],

                            album:
                                track.album?.name
                                || "",

                            imagem:
                                track.album?.images?.[0]?.url
                                || "",

                            url:
                                track.external_urls?.spotify
                                || "",

                            duracao:
                                track.duration_ms
                                || 0

                        };

                    }
                )
                : [];



        /*
            Resposta final.
        */

        return {

            statusCode:
                200,

            headers,

            body:
                JSON.stringify({

                    tracks

                })

        };

    }


    catch (error) {

        console.error(
            "Erro Spotify:",
            error
        );


        return {

            statusCode:
                500,

            headers,

            body:
                JSON.stringify({

                    error:
                        "Erro interno ao pesquisar Spotify."

                })

        };

    }

}



/* ==========================================================
   OBTER TOKEN DO SPOTIFY
========================================================== */

async function getSpotifyToken() {


    /*
        Se ainda temos um token válido,
        reutilizamos.

        Isso evita pedir um novo token
        em cada pesquisa.
    */

    if (
        spotifyToken &&
        Date.now() <
            spotifyTokenExpiration
    ) {

        return spotifyToken;

    }



    /*
        Credenciais vindas do Netlify.
    */

    const clientId =
        process.env.SPOTIFY_CLIENT_ID;


    const clientSecret =
        process.env.SPOTIFY_CLIENT_SECRET;



    /*
        Verificar credenciais.
    */

    if (
        !clientId ||
        !clientSecret
    ) {

        throw new Error(
            "Variáveis SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET não configuradas."
        );

    }



    /*
        Spotify exige:

        client_id:client_secret

        codificado em Base64.
    */

    const credentials =
        Buffer
            .from(
                `${clientId}:${clientSecret}`
            )
            .toString(
                "base64"
            );



    /*
        Pedir token.
    */

    const response =
        await fetch(
            "https://accounts.spotify.com/api/token",
            {

                method:
                    "POST",

                headers: {

                    "Authorization":
                        `Basic ${credentials}`,

                    "Content-Type":
                        "application/x-www-form-urlencoded"

                },

                body:
                    "grant_type=client_credentials"

            }
        );



    if (!response.ok) {

        const erro =
            await response.text();


        console.error(
            "Spotify Token:",
            erro
        );


        throw new Error(
            "Não foi possível obter token Spotify."
        );

    }



    const data =
        await response.json();



    /*
        Guardar token.
        
        Colocamos 60 segundos de margem
        antes de realmente expirar.
    */

    spotifyToken =
        data.access_token;


    spotifyTokenExpiration =
        Date.now() +
        (
            (data.expires_in - 60)
            * 1000
        );



    return spotifyToken;

}

