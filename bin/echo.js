'use strict';

var http = require('http');

function append(a, b) {
    if (a === undefined) return b;
    else return Buffer.concat([a, b]);
}

var server = http.createServer(function (request, response) {
    var body;
    request.on('data', function (data) { body = append(body, data); });
    request.on('end', function () {
        console.log('%s %s on %s: %s', request.method, request.url, request.headers.host, body);
        response.statusCode = 200;
        response.end(body);
    });
});
server.listen(process.env.PORT || 8080, function () {
    console.log('listening on %s', server.address().port);
});
