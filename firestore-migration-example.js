import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

/**
 * Firestore migration example for the old StateManager.saveData/getData helpers.
 *
 * Before:
 *   saveData('ka_members', members)
 *   const members = getData('ka_members')
 *
 * After:
 *   await saveData('members', memberPayload)
 *   const members = await getData('members')
 */

const resolveTenantId = () => {
    const tenantId = auth.currentUser?.uid;
    if (!tenantId) {
        throw new Error('No authenticated tenant found. Block Firestore writes until login completes.');
    }

    return tenantId;
};

export const saveData = async (collectionName, payload) => {
    const tenantId = resolveTenantId();

    const docRef = await addDoc(collection(db, collectionName), {
        tenantId,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return {
        id: docRef.id,
        tenantId,
        ...payload
    };
};

export const getData = async (collectionName) => {
    const tenantId = resolveTenantId();
    const tenantScopedQuery = query(
        collection(db, collectionName),
        where('tenantId', '==', tenantId)
    );

    const snapshot = await getDocs(tenantScopedQuery);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

window.FirestoreMigrationExample = {
    saveData,
    getData
};
