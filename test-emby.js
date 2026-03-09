const { getStreams } = require('./providers/emby.js');

// Replace '872585' with a TMDB ID you verified exists in your Emby server
getStreams('1100', 'tv', 1, 1).then(streams => {
    console.log('Streams found:', streams);
});
