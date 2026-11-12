/*
 * Coordinate parsing for the map search box.
 *
 * parseCoordinates(text) returns:
 *   null                              - text is not coordinates (use place search)
 *   {ok: true, lat: n, lon: n}        - valid coordinates
 *   {ok: false, reason: 'format'|'range'} - looks like coordinates but is invalid
 *
 * Accepts decimal degrees ("-3.639636, 38.618564"), hemisphere letters
 * ("3.639636 S, 38.618564 E"), degrees-minutes-seconds (3°38'22.7"S) and
 * degrees + decimal minutes (3°38.378'S). Latitude comes first unless the
 * hemisphere letters say otherwise.
 */
(function (root) {
    var NUM = '(\\d+(?:\\.\\d+)?)';
    // One coordinate after its hemisphere letter has been removed
    var PART = new RegExp('^([+-])?\\s*' + NUM +
        '(?:\\s*°\\s*|\\s+(?=\\d))?' +
        '(?:' + NUM + '(?:\\s*\'\\s*|\\s+(?=\\d))?)?' +
        '(?:' + NUM + '\\s*"?)?$');

    function normalize(text) {
        return String(text)
            .replace(/[′’´`]/g, "'")      // prime, curly apostrophe, accents -> '
            .replace(/[″”“]/g, '"')       // double prime, curly quotes -> "
            .replace(/''/g, '"')                          // two apostrophes -> "
            .replace(/[º˚]/g, '°')
            .replace(/[−–]/g, '-')             // minus sign, en dash -> -
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();
    }

    function splitParts(s) {
        // 1. Comma or semicolon between the two values
        var m = s.split(/\s*[,;]\s*/);
        if (m.length === 2) return m;
        if (m.length > 2) return null;
        // 2. Hemisphere letters: split after the first trailing letter, or before the second leading letter
        var after = s.match(/^(.*?[NSEW])\s*([^NSEW].*)$/);
        if (after && /\d/.test(after[1]) && /\d/.test(after[2])) return [after[1], after[2]];
        var before = s.match(/^([NSEW][^NSEW]*?)\s*([NSEW].*)$/);
        if (before) return [before[1], before[2]];
        // 3. Two plain numbers separated by a space
        var tokens = s.split(' ');
        if (tokens.length === 2) return tokens;
        // 4. DMS without separators: split after the seconds or minutes symbol
        var sym = s.match(/^(.*?")\s+([+-]?\d.*)$/) || s.match(/^(.*?')\s+([+-]?\d.*)$/);
        if (sym) return [sym[1], sym[2]];
        return null;
    }

    function parsePart(part) {
        var letters = part.match(/[NSEW]/g) || [];
        if (letters.length > 1) return null;
        var hemi = letters[0] || null;
        var body = part.replace(/[NSEW]/, '').trim();
        var m = body.match(PART);
        if (!m) return null;
        var deg = parseFloat(m[2]);
        var min = m[3] !== undefined ? parseFloat(m[3]) : 0;
        var sec = m[4] !== undefined ? parseFloat(m[4]) : 0;
        if (m[3] !== undefined && m[2].indexOf('.') !== -1) return null;   // minutes need whole degrees
        if (m[4] !== undefined && m[3].indexOf('.') !== -1) return null;   // seconds need whole minutes
        if (min >= 60 || sec >= 60) return null;
        var value = deg + min / 60 + sec / 3600;
        if (m[1] === '-' || hemi === 'S' || hemi === 'W') value = -value;
        return {value: value, axis: hemi === 'N' || hemi === 'S' ? 'lat' : hemi ? 'lon' : null};
    }

    function parseCoordinates(text) {
        var s = normalize(text);
        // Only digits, signs, separators, degree symbols and hemisphere letters, with at least two numbers
        if (!/^[\d\s.,;°'"+\-NSEW]+$/.test(s)) return null;
        if ((s.match(/\d+(?:\.\d+)?/g) || []).length < 2) return null;
        var parts = splitParts(s);
        if (!parts) return {ok: false, reason: 'format'};
        var a = parsePart(parts[0]);
        var b = parsePart(parts[1]);
        if (!a || !b) return {ok: false, reason: 'format'};
        var lat, lon;
        if (a.axis && b.axis && a.axis === b.axis) return {ok: false, reason: 'format'};
        if (a.axis === 'lon' || b.axis === 'lat') { lat = b.value; lon = a.value; }
        else { lat = a.value; lon = b.value; }
        if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return {ok: false, reason: 'range'};
        return {ok: true, lat: lat, lon: lon};
    }

    function toDMS(value, pos, neg) {
        var a = Math.abs(value);
        var d = Math.floor(a);
        var mFloat = (a - d) * 60;
        var m = Math.floor(mFloat);
        var s = Math.round((mFloat - m) * 600) / 10;
        if (s >= 60) { s = 0; m += 1; }
        if (m >= 60) { m = 0; d += 1; }
        return d + '°' + (m < 10 ? '0' : '') + m + "'" + (s < 10 ? '0' : '') + s.toFixed(1) + '"' + (value < 0 ? neg : pos);
    }

    function formatDMS(lat, lon) {
        return toDMS(lat, 'N', 'S') + ' ' + toDMS(lon, 'E', 'W');
    }

    var api = {parseCoordinates: parseCoordinates, formatDMS: formatDMS};
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else { root.parseCoordinates = parseCoordinates; root.formatDMS = formatDMS; }
})(this);
