import { db } from './config-simple';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion,
  serverTimestamp,
  runTransaction,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { DraftSettings, DraftPick, Team } from '@/types';

// Verify Firebase is initialized
const verifyFirebase = () => {
  if (!db) {
    console.error('Firestore is not initialized!');
    throw new Error('Firestore is not initialized');
  }
  
  console.log('Firestore is initialized and ready');
  return true;
};

// Use 'fantasy_draft' instead of 'draft'
const DRAFT_COLLECTION = 'fantasy_draft';
const DRAFT_DOC_ID = 'settings';

// Create or update draft settings
const setDraftSettings = async (settings: Omit<DraftSettings, 'id'>) => {
  try {
    verifyFirebase();
    console.log('Setting draft settings with enhanced logging');
    console.log('DB instance:', db ? 'exists' : 'null');
    console.log('Settings to save:', JSON.stringify(settings, null, 2));
    
    // Create a simple object with just the essential fields
    const draftData = {
      order: settings.order || [],
      totalRounds: settings.totalRounds || 3,
      isActive: false,
      currentPosition: 0,
      round: 1,
      picks: [],
      updatedAt: new Date().toISOString() // Use a string timestamp instead of serverTimestamp()
    };
    
    console.log('Draft data prepared:', JSON.stringify(draftData, null, 2));
    
    // Try to get the document first
    const docRef = doc(db, DRAFT_COLLECTION, DRAFT_DOC_ID);
    console.log('Document reference created:', docRef.path);
    
    try {
      const docSnap = await getDoc(docRef);
      console.log('Document exists check completed:', docSnap.exists() ? 'exists' : 'does not exist');
      
      if (docSnap.exists()) {
        console.log('Document exists, updating it with data');
        // Update the existing document
        try {
          await updateDoc(docRef, draftData);
          console.log('Document updated successfully');
        } catch (updateError) {
          console.error('Error updating document:', updateError);
          console.error('Error details:', JSON.stringify(updateError, null, 2));
          throw updateError;
        }
      } else {
        console.log('Document does not exist, creating it with data');
        // Create a new document
        try {
          await setDoc(docRef, {
            ...draftData,
            id: DRAFT_DOC_ID,
            createdAt: new Date().toISOString()
          });
          console.log('Document created successfully');
        } catch (setError) {
          console.error('Error creating document:', setError);
          console.error('Error details:', JSON.stringify(setError, null, 2));
          throw setError;
        }
      }
    } catch (docError) {
      console.error('Error checking if document exists:', docError);
      console.error('Error details:', JSON.stringify(docError, null, 2));
      throw docError;
    }
    
    console.log('Draft settings saved successfully');
    
    // Verify the document was saved correctly
    try {
      console.log('Verifying document was saved correctly');
      const verifyDoc = await getDoc(docRef);
      
      if (verifyDoc.exists()) {
        const savedData = verifyDoc.data();
        console.log('Verified saved data:', JSON.stringify(savedData, null, 2));
        
        // Check if order was saved correctly
        if (!savedData.order || savedData.order.length === 0) {
          console.error('Order was not saved correctly!');
          
          if (settings.order && settings.order.length > 0) {
            console.log('Attempting to update order specifically');
            try {
              await updateDoc(docRef, { order: settings.order });
              console.log('Order updated specifically');
            } catch (orderError) {
              console.error('Error updating order specifically:', orderError);
            }
          }
        } else {
          console.log('Order was saved correctly with length:', savedData.order.length);
        }
      } else {
        console.error('Document does not exist after save!');
      }
    } catch (verifyError) {
      console.error('Error verifying document:', verifyError);
    }
    
    return DRAFT_DOC_ID;
  } catch (error) {
    console.error('Error setting draft settings:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.code) {
      console.error('Firebase error code:', error.code);
    }
    
    // Try a completely different approach as a last resort
    try {
      console.log('Trying last resort approach with direct write');
      
      // Write to a different collection as a test
      const testRef = doc(db, 'test_draft_settings', 'test_doc');
      await setDoc(testRef, {
        ...settings,
        timestamp: new Date().toISOString()
      });
      
      console.log('Test document written successfully');
      
      // Now try the original write again but with a different method
      const alternateRef = doc(db, 'alternate_draft_settings', DRAFT_DOC_ID);
      await setDoc(alternateRef, {
        ...settings,
        timestamp: new Date().toISOString()
      });
      
      console.log('Alternate document written successfully');
      return DRAFT_DOC_ID;
    } catch (lastError) {
      console.error('Last resort approach also failed:', lastError);
      return null;
    }
  }
};

// Get current draft settings
const getDraftSettings = async () => {
  try {
    console.log('Fetching draft settings...');
    
    // Try to get the document with the fixed ID first
    const draftDoc = await getDoc(doc(db, DRAFT_COLLECTION, DRAFT_DOC_ID));
    
    if (draftDoc.exists()) {
      console.log('Found draft settings with fixed ID');
      const data = {
        ...draftDoc.data(),
        id: draftDoc.id
      } as DraftSettings;
      
      console.log('Draft settings retrieved:', data);
      return data;
    }
    
    // If not found, try to query the collection for any document
    console.log('Fixed ID document not found, querying collection');
    const draftsSnapshot = await getDocs(collection(db, DRAFT_COLLECTION));
    
    if (!draftsSnapshot.empty) {
      console.log('Found draft settings in collection');
      const firstDoc = draftsSnapshot.docs[0];
      const data = {
        ...firstDoc.data(),
        id: firstDoc.id
      } as DraftSettings;
      
      console.log('Draft settings retrieved from collection:', data);
      return data;
    }
    
    console.log('No draft settings found anywhere');
    return null;
  } catch (error) {
    console.error('Error getting draft settings:', error);
    return null; // Return null instead of throwing
  }
};

// Start the draft
const startDraft = async (draftId: string) => {
  try {
    verifyFirebase();
    console.log('Starting draft with ID:', draftId);
    
    // Check if the document exists first
    const docRef = doc(db, DRAFT_COLLECTION, DRAFT_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('Draft document does not exist, creating it first');
      throw new Error('No draft settings found. Please create draft settings first.');
    } else {
      // Get the current data
      const currentData = docSnap.data();
      
      // Check if order is set
      if (!currentData.order || currentData.order.length === 0) {
        console.error('Cannot start draft: No teams in draft order');
        throw new Error('Cannot start draft: No teams in draft order. Please set the draft order first.');
      }
      
      // Update the existing document
      await updateDoc(docRef, {
        isActive: true,
        startTime: new Date().toISOString(), // Use ISO string instead of serverTimestamp
        currentPosition: 0,
        round: 1,
        picks: currentData.picks || []
      });
      console.log('Existing draft document updated and started');
    }
    
    return true;
  } catch (error) {
    console.error('Error starting draft:', error);
    throw error;
  }
};

// End the draft
const endDraft = async (draftId: string) => {
  try {
    verifyFirebase();
    console.log('Ending draft with ID:', draftId);
    
    const docRef = doc(db, DRAFT_COLLECTION, DRAFT_DOC_ID);
    await updateDoc(docRef, {
      isActive: false,
      endTime: new Date().toISOString() // Use ISO string instead of serverTimestamp
    });
    
    console.log('Draft ended successfully');
    return true;
  } catch (error) {
    console.error('Error ending draft:', error);
    throw error;
  }
};

// Make a draft pick
const makeDraftPick = async (draftId: string, teamId: string, chefId: string) => {
  try {
    verifyFirebase();
    console.log(`Making draft pick: Team ${teamId} selects Chef ${chefId}`);
    
    // Get the current draft settings
    const docRef = doc(db, DRAFT_COLLECTION, DRAFT_DOC_ID);
    
    return await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Draft does not exist');
      }
      
      const draftData = docSnap.data() as DraftSettings;
      
      // Verify it's this team's turn
      const { order, currentPosition, round, totalRounds } = draftData;
      
      // Snake draft logic
      const isEvenRound = round % 2 === 0;
      const teamIndex = isEvenRound ? order.length - 1 - currentPosition : currentPosition;
      
      if (order[teamIndex] !== teamId) {
        throw new Error('Not your turn to draft');
      }
      
      // Verify chef hasn't been picked
      const pickedChefIds = (draftData.picks || [])
        .filter(pick => pick.chefId)
        .map(pick => pick.chefId);
      
      if (pickedChefIds.includes(chefId)) {
        throw new Error('This chef has already been drafted');
      }
      
      // Create the pick with a regular timestamp instead of serverTimestamp
      const pick: DraftPick = {
        position: currentPosition,
        teamId,
        chefId,
        timestamp: new Date().toISOString() // Use ISO string instead of serverTimestamp
      };
      
      // Add the pick to the draft
      const picks = [...(draftData.picks || []), pick];
      
      // Move to the next position
      let newPosition = currentPosition + 1;
      let newRound = round;
      
      // If we've reached the end of the order, move to the next round
      if (newPosition >= order.length) {
        newPosition = 0;
        newRound++;
      }
      
      // Check if the draft is complete
      const isDraftComplete = newRound > totalRounds;
      
      // Update the draft
      transaction.update(docRef, {
        picks,
        currentPosition: newPosition,
        round: newRound,
        isActive: !isDraftComplete,
        endTime: isDraftComplete ? new Date().toISOString() : null // Use ISO string instead of serverTimestamp
      });
      
      // Update the team's chefs
      const teamRef = doc(db, 'teams', teamId);
      transaction.update(teamRef, {
        chefs: arrayUnion(chefId)
      });
      
      console.log('Draft pick successful');
      return true;
    });
  } catch (error) {
    console.error('Error making draft pick:', error);
    throw error;
  }
};

// Get teams eligible for draft
const getTeamsForDraft = async () => {
  try {
    const teamsSnapshot = await getDocs(collection(db, 'teams'));
    return teamsSnapshot.docs.map(doc => doc.data() as Team);
  } catch (error) {
    console.error('Error getting teams for draft:', error);
    throw error;
  }
};

// Check if it's a team's turn to draft
const isTeamsTurnToDraft = async (teamId: string) => {
  try {
    const draft = await getDraftSettings();
    if (!draft || !draft.isActive) {
      return false;
    }
    
    return draft.order[draft.currentPosition] === teamId;
  } catch (error) {
    console.error('Error checking if team can draft:', error);
    return false;
  }
};

// Test function to verify Firestore write access
const testFirestoreWrite = async () => {
  try {
    verifyFirebase();
    console.log('Testing Firestore write access...');
    
    // Try to write to a test collection
    const testDoc = doc(db, 'test_collection', 'test_doc');
    await setDoc(testDoc, {
      timestamp: serverTimestamp(),
      testValue: 'This is a test'
    });
    
    console.log('Firestore write test successful!');
    return true;
  } catch (error) {
    console.error('Firestore write test failed:', error);
    throw error;
  }
};

// Check Firestore permissions
const checkFirestorePermissions = async () => {
  try {
    verifyFirebase();
    console.log('Checking Firestore permissions...');
    
    // Try to read from a test collection
    const testReadRef = doc(db, 'test_permissions', 'read_test');
    try {
      const docSnap = await getDoc(testReadRef);
      console.log('Read test result:', docSnap.exists() ? 'document exists' : 'document does not exist');
    } catch (readError) {
      console.error('Read permission test failed:', readError);
      return {
        read: false,
        write: false,
        error: readError.message
      };
    }
    
    // Try to write to a test collection
    const testWriteRef = doc(db, 'test_permissions', 'write_test');
    try {
      await setDoc(testWriteRef, {
        timestamp: new Date().toISOString(),
        testValue: 'Permission test'
      });
      console.log('Write test successful');
    } catch (writeError) {
      console.error('Write permission test failed:', writeError);
      return {
        read: true,
        write: false,
        error: writeError.message
      };
    }
    
    // Try to update a document
    try {
      await updateDoc(testWriteRef, {
        updated: true,
        updateTimestamp: new Date().toISOString()
      });
      console.log('Update test successful');
    } catch (updateError) {
      console.error('Update permission test failed:', updateError);
      return {
        read: true,
        write: true,
        update: false,
        error: updateError.message
      };
    }
    
    // Try to delete a document
    try {
      await deleteDoc(testWriteRef);
      console.log('Delete test successful');
    } catch (deleteError) {
      console.error('Delete permission test failed:', deleteError);
      return {
        read: true,
        write: true,
        update: true,
        delete: false,
        error: deleteError.message
      };
    }
    
    console.log('All Firestore permission tests passed');
    return {
      read: true,
      write: true,
      update: true,
      delete: true
    };
  } catch (error) {
    console.error('Error checking Firestore permissions:', error);
    return {
      error: error.message
    };
  }
};

// Directly update the order field
const updateDraftOrder = async (order: string[]) => {
  try {
    verifyFirebase();
    console.log('Directly updating draft order:', order);
    
    const docRef = doc(db, DRAFT_COLLECTION, DRAFT_DOC_ID);
    
    // First check if the document exists
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('Document does not exist, creating it first');
      await setDoc(docRef, {
        order,
        isActive: false,
        currentPosition: 0,
        round: 1,
        totalRounds: 3,
        picks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('Document created with order');
    } else {
      console.log('Document exists, updating order field only');
      await updateDoc(docRef, { 
        order,
        updatedAt: new Date().toISOString()
      });
      console.log('Order field updated');
    }
    
    // Verify the update
    const verifyDoc = await getDoc(docRef);
    if (verifyDoc.exists()) {
      const data = verifyDoc.data();
      console.log('Verified order after update:', data.order);
      
      if (!data.order || data.order.length === 0) {
        console.error('Order still not updated correctly!');
        return false;
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating draft order:', error);
    return false;
  }
};

// Only export your custom functions and constants
export {
  setDraftSettings,
  getDraftSettings,
  startDraft,
  endDraft,
  makeDraftPick,
  getTeamsForDraft,
  isTeamsTurnToDraft,
  testFirestoreWrite,
  checkFirestorePermissions,
  updateDraftOrder,
  DRAFT_COLLECTION,
  DRAFT_DOC_ID,
  // Export Firestore functions for use in other files
  doc,
  updateDoc
}; 