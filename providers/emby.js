const EMBY_SERVER = "https://play.embyil.tv:443";
const USERNAME = "s851pmcm";
const PASSWORD = "Aa10203040!!";
const USER_ID = "3ee5327c07d44fed9e44b65958f990f1";
const PROVIDER_ID = "Emby";

function getStreams(tmdbId, mediaType, season, episode) {
    const seasonNum = toNumberOrNull(season);
    const episodeNum = toNumberOrNull(episode);
    const media = String(mediaType || "").toLowerCase();
    const isTv = media === "tv" || media === "series" || media === "show" || (seasonNum != null && episodeNum != null);

    console.log(`[${PROVIDER_ID}] request tmdb=${tmdbId} mediaType=${mediaType} season=${season} episode=${episode}`);

    return login()
        .then(token => {
            if (isTv) {
                return findSeriesByTmdb(token, tmdbId)
                    .then(series => {
                        if (!series || seasonNum == null || episodeNum == null) {
                            console.log(`[${PROVIDER_ID}] no series or missing season/episode`);
                            return [];
                        }
                        return findEpisode(token, series.Id, seasonNum, episodeNum)
                            .then(ep => {
                                if (!ep) {
                                    console.log(`[${PROVIDER_ID}] episode not found for S${seasonNum}E${episodeNum}`);
                                    return [];
                                }
                                return [toStream(ep, token)];
                            });
                    });
            }

            return findMovieByTmdb(token, tmdbId)
                .then(movie => {
                    if (!movie) {
                        console.log(`[${PROVIDER_ID}] movie not found`);
                        return [];
                    }
                    return [toStream(movie, token)];
                });
        })
        .catch(err => {
            console.error(`[${PROVIDER_ID}] error: ${err && err.message ? err.message : String(err)}`);
            return [];
        });
}

function login() {
    const headers = {
        "Content-Type": "application/json",
        "X-Emby-Authorization": 'Emby Client="EmbyWeb", Device="Android TV", DeviceId="androidtv-1234", Version="1.0.0"'
    };

    return fetch(`${EMBY_SERVER}/Users/AuthenticateByName`, {
        method: "POST",
        headers,
        body: JSON.stringify({ Username: USERNAME, Pw: PASSWORD })
    })
        .then(readJson)
        .then(data => {
            if (!data.AccessToken) throw new Error("No AccessToken returned");
            return data.AccessToken;
        });
}

function findMovieByTmdb(token, tmdbId) {
    const url = `${EMBY_SERVER}/Users/${USER_ID}/Items?AnyProviderIdEquals=Tmdb.${encodeURIComponent(tmdbId)}&IncludeItemTypes=Movie&Recursive=true&Limit=1&api_key=${token}`;
    return fetch(url)
        .then(readJson)
        .then(data => data.Items && data.Items[0]);
}

function findSeriesByTmdb(token, tmdbId) {
    const url = `${EMBY_SERVER}/Users/${USER_ID}/Items?AnyProviderIdEquals=Tmdb.${encodeURIComponent(tmdbId)}&IncludeItemTypes=Series&Recursive=true&Limit=1&api_key=${token}`;
    return fetch(url)
        .then(readJson)
        .then(data => data.Items && data.Items[0]);
}

function findEpisode(token, seriesId, seasonNum, episodeNum) {
    const url = `${EMBY_SERVER}/Shows/${seriesId}/Episodes?UserId=${USER_ID}&Season=${seasonNum}&api_key=${token}`;
    return fetch(url)
        .then(readJson)
        .then(data => {
            if (!data.Items || !data.Items.length) return null;
            return data.Items.find(item => Number(item.IndexNumber) === episodeNum) || null;
        });
}

function toStream(item, token) {
    return {
        name: PROVIDER_ID,
        title: item.Name || "Emby Stream",
        url: `${EMBY_SERVER}/Videos/${item.Id}/stream?static=true&api_key=${token}`,
        quality: "Auto",
        provider: PROVIDER_ID
    };
}

function toNumberOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function readJson(res) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// Export for Nuvio
if (typeof module !== "undefined") module.exports = { getStreams };
