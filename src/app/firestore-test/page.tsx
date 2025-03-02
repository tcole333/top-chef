'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/config-simple';
import { collection, getDocs } from 'firebase/firestore';

export default function FirestoreTestPage() {
  const [status, setStatus] = useState('Testing Firestore connection...');
  const [error, setError] = useState('');

  useEffect(() => {
    const testFirestore = async () => {
      try {
        console.log('Firestore instance:', db);
        
        // Try to access a collection
        const testCollection = collection(db, 'test');
        console.log('Test collection reference:', testCollection);
        
        // Try to get documents (this might be empty, which is fine)
        const snapshot = await getDocs(testCollection);
        console.log('Test query executed, docs count:', snapshot.size);
        
        setStatus(`Firestore connection successful! Found ${snapshot.size} documents in test collection.`);
      } catch (error) {
        console.error('Firestore test error:', error);
        setError(String(error));
        setStatus('Firestore connection failed. See error below.');
      }
    };

    testFirestore();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Firestore Connection Test</h1>
      
      <div className={`p-4 rounded ${error ? 'bg-red-100' : 'bg-green-100'}`}>
        <p className="font-bold">{status}</p>
        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded overflow-auto">
            <pre className="text-red-700 text-sm">{error}</pre>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Debug Information</h2>
        <p>Check the browser console for detailed debug logs.</p>
      </div>
    </div>
  );
} 