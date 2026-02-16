const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

async function fetchCircuit() {
    try {
        const res = await fetch(`${BASE_URL}/current/circuits/albert_park.json`);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

fetchCircuit();
