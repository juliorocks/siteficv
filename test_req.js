
import http from 'http';

const options = {
    hostname: 'localhost',
    port: 5173,
    path: '/curso/pos-graduacao/psicopedagogia',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let data = '';
    res.on('data', (chunk) => {
        if (data.length < 500) data += chunk; // capturing start
    });
    res.on('end', () => {
        console.log('BODY START:', data.substring(0, 500));
        // Check for unique string in curso.html vs index.html
        if (data.includes('DEBUG: CURSO TEMPLATE LOADED')) {
            console.log('VERDICT: CURSO TEMPLATE');
        } else if (data.includes('hero-slider')) { // index.html has hero-slider
            console.log('VERDICT: INDEX HTML');
        } else {
            console.log('VERDICT: UNKNOWN');
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
