// Run with: node tests/coords.test.js
var coords = require('../js/coords.js');

var cases = [
    {input: '-3.639636, 38.618564', lat: -3.639636, lon: 38.618564},
    {input: '-3.639636 38.618564', lat: -3.639636, lon: 38.618564},
    {input: '3°38\'22.7"S, 38°37\'06.8"E', lat: -3.639639, lon: 38.618556},
    {input: '3.639636 S, 38.618564 E', lat: -3.639636, lon: 38.618564},
    {input: '3°38.378\'S 38°37.113\'E', lat: -3.639633, lon: 38.618550},
    {input: 'Voi', expect: 'not coordinates'},
    {input: '95, 200', expect: 'rejected'},
    // extra forms from the spec
    {input: '3°38′22.7″S, 38°37′06.8″E', lat: -3.639639, lon: 38.618556},
    {input: "3°38'22.7''S, 38°37'06.8''E", lat: -3.639639, lon: 38.618556},
    {input: '38.618564 E, 3.639636 S', lat: -3.639636, lon: 38.618564},
    {input: 'Maungu', expect: 'not coordinates'}
];

var failed = 0;
cases.forEach(function (c) {
    var r = coords.parseCoordinates(c.input);
    var pass, got;
    if (c.expect === 'not coordinates') {
        pass = r === null;
        got = r === null ? 'not coordinates' : JSON.stringify(r);
    } else if (c.expect === 'rejected') {
        pass = r !== null && r.ok === false;
        got = r && r.ok === false ? 'rejected (' + r.reason + ')' : JSON.stringify(r);
    } else {
        pass = !!(r && r.ok && Math.abs(r.lat - c.lat) < 2e-6 && Math.abs(r.lon - c.lon) < 2e-6);
        got = r && r.ok ? r.lat.toFixed(6) + ', ' + r.lon.toFixed(6) : JSON.stringify(r);
    }
    if (!pass) failed++;
    console.log((pass ? 'PASS' : 'FAIL') + '  ' + JSON.stringify(c.input) + '  ->  ' + got);
});

var dms = coords.formatDMS(-3.639636, 38.618564);
var dmsPass = dms === '3°38\'22.7"S 38°37\'06.8"E';
if (!dmsPass) failed++;
console.log((dmsPass ? 'PASS' : 'FAIL') + '  formatDMS(-3.639636, 38.618564)  ->  ' + dms);

console.log(failed ? '\n' + failed + ' failed' : '\nAll passed');
process.exit(failed ? 1 : 0);
