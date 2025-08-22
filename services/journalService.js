import api from '../utils/api';
import * as FileSystem from 'expo-file-system';

// Get all journal entries for the current user
export const getJournals = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    
    const response = await api.get(`/journals?${params}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch journal entries' };
  }
};

// Get a single journal entry by ID
export const getJournal = async (journalId) => {
  try {
    const response = await api.get(`/journals/${journalId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch journal entry' };
  }
};

// Create a new journal entry
export const createJournal = async (journalData) => {
  try {
    const response = await api.post('/journals', journalData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to create journal entry' };
  }
};

// Update an existing journal entry
export const updateJournal = async (journalId, journalData) => {
  try {
    const response = await api.put(`/journals/${journalId}`, journalData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to update journal entry' };
  }
};

// Delete a journal entry
export const deleteJournal = async (journalId) => {
  try {
    const response = await api.delete(`/journals/${journalId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to delete journal entry' };
  }
};

// Upload media and associate with journal
export const uploadMedia = async (mediaFile, journalId, caption = '') => {
  try {
    // Create form data for file upload
    const formData = new FormData();
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(mediaFile.uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    
    // Determine file type and name
    const fileExtension = mediaFile.uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    
    // Create file object for form data
    const file = {
      uri: mediaFile.uri,
      name: fileName,
      type: mediaFile.type === 'photo' ? 'image/jpeg' : 
            mediaFile.type === 'video' ? 'video/mp4' : 'audio/m4a'
    };
    
    // Append file and metadata to form data
    formData.append('file', file);
    formData.append('journalId', journalId);
    if (caption) {
      formData.append('caption', caption);
    }
    
    // Make API request with form data
    const response = await api.post('/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to upload media' };
  }
};

// Add this function to the journalService.js file

// Handle media upload with retry capability
export const uploadMediaWithRetry = async (mediaFile, journalId, caption = '', maxRetries = 2) => {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      return await uploadMedia(mediaFile, journalId, caption);
    } catch (error) {
      retries++;
      
      // If we've reached max retries, throw the error
      if (retries > maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
};

// Create journal with media in a single request
export const createJournalWithMedia = async (journalData, mediaFiles = [], isProtected = false, entryPassword = null) => {
  try {
    // Validate journal data
    if (!journalData.category || !['personal', 'professional'].includes(journalData.category)) {
      throw new Error('Category must be either "personal" or "professional"');
    }
    
    // Create form data
    const formData = new FormData();
    
    // Add journal data with proper validation
    formData.append('title', journalData.title || 'Untitled Entry');
    formData.append('content', journalData.content || '');
    formData.append('category', journalData.category); // Ensure category is always sent
    formData.append('mood', journalData.mood || 'neutral');
    formData.append('location', journalData.location || '');
    formData.append('tags', JSON.stringify(journalData.tags || []));
    
    // Add protection data if enabled
    if (isProtected && entryPassword) {
      formData.append('isProtected', 'true');
      formData.append('password', entryPassword);
    }
    
    // Add media files with optimization
    for (let i = 0; i < mediaFiles.length; i++) {
      const mediaFile = mediaFiles[i];
      
      try {
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(mediaFile.uri);
        if (!fileInfo.exists) {
          throw new Error(`File ${i} does not exist`);
        }
        
        // Check file size (limit to 10MB)
        if (fileInfo.size > 10 * 1024 * 1024) {
          throw new Error(`File ${i} is too large. Maximum size is 10MB`);
        }
        
        // Determine file type and name
        const fileExtension = mediaFile.uri.split('.').pop()?.toLowerCase();
        const fileName = `${Date.now()}_${i}.${fileExtension}`;
        
        // Validate file type
        const allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const allowedVideoTypes = ['mp4', 'mov', 'avi'];
        const allowedAudioTypes = ['m4a', 'mp3', 'wav'];
        
        const isImage = allowedImageTypes.includes(fileExtension);
        const isVideo = allowedVideoTypes.includes(fileExtension);
        const isAudio = allowedAudioTypes.includes(fileExtension);
        
        if (!isImage && !isVideo && !isAudio) {
          throw new Error(`File ${i} has unsupported format`);
        }
        
        // Create file object with proper MIME type
        const file = {
          uri: mediaFile.uri,
          name: fileName,
          type: isImage ? 'image/jpeg' : 
                isVideo ? 'video/mp4' : 'audio/m4a'
        };
        
        // Append file to form data
        formData.append('files', file);
      } catch (fileError) {
        console.error(`Error processing file ${i}:`, fileError);
        throw new Error(`Failed to process file ${i}: ${fileError.message}`);
      }
    }
    
    // Make API request with timeout
    const response = await api.post('/journals/with-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating journal with media:', error);
    throw error.response?.data || { 
      error: error.message || 'Failed to create journal with media' 
    };
  }
};

// Get mood analytics for the current user
export const getMoodAnalytics = async (timeFilter = 'week') => {
  try {
    const response = await api.get(`/journals/mood-analytics?timeFilter=${timeFilter}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch mood analytics' };
  }
};

// Protect a journal entry with password
export const protectJournalEntry = async (entryId, password) => {
  try {
    const response = await api.post(`/journals/${entryId}/protect`, {
      password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to protect journal entry' };
  }
};

// Unlock a protected journal entry
export const unlockProtectedEntry = async (entryId, password = null, useBiometrics = false) => {
  try {
    // If using biometrics, attempt biometric authentication
    if (useBiometrics) {
      // Use expo-local-authentication for biometric auth
      const { LocalAuthentication } = require('expo-local-authentication');
      
      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to unlock journal entry',
        fallbackLabel: 'Use password instead',
      });
      
      if (!biometricAuth.success) {
        throw new Error('Biometric authentication failed');
      }
    }
    
    // Make API request to unlock entry
    const response = await api.post(`/journals/${entryId}/unlock`, {
      password,
      useBiometrics
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to unlock journal entry' };
  }
};

// Remove protection from a journal entry
export const unprotectJournalEntry = async (entryId, password) => {
  try {
    const response = await api.post(`/journals/${entryId}/unprotect`, {
      password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to remove protection from journal entry' };
  }
};