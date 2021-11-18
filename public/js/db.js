const pendingObjectStoreName = `pending`;
const request = indexedDB.open(`budget`, 2);

request.onupgradeneeded = e => {
    const db = request.result;
    console.log(e);
    if(!db.objectStoreNames.contains(pendingObjectStoreName)) {
        db.createObjectStore(pendingObjectStoreName, { autoIncrement: true });
    }
};

request.onsuccess = e => {
    console.log(`Success! ${e.type}`);
    if (navigator.onLine) {
        checkDB();
    }
};

request.onerror = e => console.error(e);

function checkDB() {
    const db = request.result;
    let transaction = db.transaction([pendingObjectStoreName], `readwrite`);
    let store = transaction.objectStore(pendingObjectStoreName);
    const getAll = store.getAll();
    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch(`/api/transaction/bulk`, {
                method: `POST`,
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: `application/json, text/plain, */*`,
                    "Content-Type": `application/json`
                }
            }) .then(response => response.json())
               .then(() => {
                   transaction = db.transaction([pendingObjectStoreName], `readwrite`);
                   store = transaction.objectStore(pendingObjectStoreName);
                   store.clear();
               });
        }
    }
};

function saveTransactions(transaction) {
    const db = request.result;
    const transaction = db.transaction([pendingObjectStoreName], `readwrite`);
    const store = transaction.objectStore(pendingObjectStoreName);
    store.add(transaction);
}

window.addEventListener(`online`, checkDB);