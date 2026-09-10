const TOKEN_URL = "https://accounts.spotify.com/api/token";
const SEARCH_URL = "https://api.spotify.com/v1/search";

let accessToken = null;
let tokenExpiresAt = 0;

async function obterTokenSpotify() {
    const agora = Date.now();

    if (accessToken && agora < tokenExpiresAt) {
        return accessToken;
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Variáveis do Spotify não configuradas no Netlify.");
    }

    const credenciais = Buffer.from(
        `${clientId}:${clientSecret}`
    ).toString("base64");

    const resposta = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${credenciais}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
    });

    if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(`Erro ao obter token Spotify: ${erro}`);
    }

    const dados = await resposta.json();

    accessToken = dados.access_token;

    tokenExpiresAt = agora + ((dados.expires_in - 60) * 1000);

    return accessToken;
}

export default async (req) => {
    try {
        const url = new URL(req.url);

        const termo = url.searchParams.get("q");

        if (!termo || termo.trim().length < 2) {
            return new Response(
                JSON.stringify({
                    tracks: []
                }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const token = await obterTokenSpotify();

        const parametros = new URLSearchParams({
            q: termo.trim(),
            type: "track",
            limit: "12"
        });

        const resposta = await fetch(
            `${SEARCH_URL}?${parametros.toString()}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!resposta.ok) {
            const erro = await resposta.text();

            return new Response(
                JSON.stringify({
                    erro: "Erro na API do Spotify",
                    detalhes: erro
                }),
                {
                    status: resposta.status,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const dados = await resposta.json();

        const tracks = (dados.tracks?.items || []).map((musica) => ({
            id: musica.id,
            titulo: musica.name,
            artistas: musica.artists.map((artista) => artista.name),
            album: musica.album?.name || "",
            imagem: musica.album?.images?.[0]?.url || "",
            url: musica.external_urls?.spotify || ""
        }));

        return new Response(
            JSON.stringify({
                tracks
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (erro) {

        console.error("Spotify Function Error:", erro);

        return new Response(
            JSON.stringify({
                erro: "Erro interno na função Spotify.",
                detalhes: erro.message
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
};