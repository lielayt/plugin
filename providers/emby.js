const EMBY_SERVER = "https://play.embyil.tv:443";
const USERNAME = "s851pmcm";
const PASSWORD = "Aa10203040!!";
const USER_ID = "3ee5327c07d44fed9e44b65958f990f1";

function getStreams(tmdbId, mediaType, season, episode) {

    return login().then(token => {

        return searchItem(token, tmdbId).then(item => {

            if (!item) return [];

            const streamUrl =
                EMBY_SERVER +
                "/Videos/" +
                item.Id +
                "/stream?static=true&api_key=" +
                token;

            return [{
                name: "Emby",
                title: item.Name,
                url: streamUrl,
                quality: "Auto",
                provider: "emby"
            }];

        });

    }).catch(() => []);
}

function login() {

    return fetch(EMBY_SERVER + "/Users/AuthenticateByName", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            Username: USERNAME,
            Pw: PASSWORD
        })
    })
    .then(res => res.json())
    .then(data => data.AccessToken);
}

function searchItem(token, tmdbId) {

    const url =
        EMBY_SERVER +
        "/Users/" +
        USER_ID +
        "/Items?AnyProviderIdEquals=Tmdb." +
        tmdbId +
        "&api_key=" +
        token;

    return fetch(url)
        .then(res => res.json())
        .then(data => data.Items && data.Items[0]);
}

if (typeof module !== "undefined") {
    module.exports = { getStreams };
}