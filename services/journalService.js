import api from '../utils/api';
import * as FileSystem from 'expo-file-system';

// Create a new journal entry
export const createJournal = async (journalData) => {
  try {
    const response = await api.post('/journals', journalData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to create journal entry' };
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
export const createJournalWithMedia = async (journalData, mediaFiles = []) => {
  try {
    // Create form data
    const formData = new FormData();
    
    // Add journal data
    formData.append('title', journalData.title || 'Untitled Entry');
    formData.append('content', journalData.content || '');
    if (journalData.mood) formData.append('mood', journalData.mood);
    if (journalData.location) formData.append('location', journalData.location);
    if (journalData.tags && journalData.tags.length > 0) {
      formData.append('tags', JSON.stringify(journalData.tags));
    }
    
    // Add media files
    for (let i = 0; i < mediaFiles.length; i++) {
      const mediaFile = mediaFiles[i];
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(mediaFile.uri);
      if (!fileInfo.exists) {
        throw new Error(`File ${i} does not exist`);
      }
      
      // Determine file type and name
      const fileExtension = mediaFile.uri.split('.').pop();
      const fileName = `${Date.now()}_${i}.${fileExtension}`;
      
      // Create file object
      const file = {
        uri: mediaFile.uri,
        name: fileName,
        type: mediaFile.type === 'photo' ? 'image/jpeg' : 
              mediaFile.type === 'video' ? 'video/mp4' : 'audio/m4a'
      };
      
      // Append file to form data
      formData.append('files', file);
    }
    
    // Make API request
    const response = await api.post('/journals/with-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to create journal with media' };
  }
};