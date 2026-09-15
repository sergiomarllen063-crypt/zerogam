export default async (req) => {
    try {
        const url = new URL(req.url);
        const query = url.searchParams.get("q");

        if (!query || query.trim() === "") {
            return new Response(
                JSON.stringify({
                    error: "Digite o nome de uma música."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const apiKey = process.env.YOUTUBE_API_KEY;

        if (!apiKey) {
            return new Response(
                JSON.stringify({
                    error: "YOUTUBE_API_KEY não configurada no Netlify."
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const youtubeUrl =
            "https://www.googleapis.com/youtube/v3/search" +
            "?part=snippet" +
            "&type=video" +
            "&maxResults=10" +
            "&q=" + encodeURIComponent(query) +
            "&regionCode=AO" +
            "&relevanceLanguage=pt" +
            "&key=" + encodeURIComponent(apiKey);

        const response = await fetch(youtubeUrl);
        const data = await response.json();

        if (!response.ok) {
            return new Response(
                JSON.stringify({
                    error: "Erro na API do YouTube.",
                    detalhes: data
                }),
                {
                    status: response.status,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const resultados = (data.items || [])
            .filter(item => item.id && item.id.videoId)
            .map(item => ({
                id: item.id.videoId,
                titulo: item.snippet.title,
                canal: item.snippet.channelTitle,
                descricao: item.snippet.description,
                capa:
                    item.snippet.thumbnails?.high?.url ||
                    item.snippet.thumbnails?.medium?.url ||
                    item.snippet.thumbnails?.default?.url,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`
            }));

        return new Response(
            JSON.stringify({
                sucesso: true,
                resultados: resultados
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({
                error: "Erro interno na função.",
                detalhes: error.message
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