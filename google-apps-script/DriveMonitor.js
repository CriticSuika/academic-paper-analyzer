/**
 * Google Apps Script for monitoring Google Drive changes
 * This script detects new folders in the AcademicPapers directory
 * and sends webhook notifications to Make.com
 */

const WEBHOOK_URL = 'YOUR_MAKE_WEBHOOK_URL_HERE';
const ACADEMIC_PAPERS_FOLDER_ID = 'YOUR_FOLDER_ID_HERE';

/**
 * Set up trigger for Drive changes
 * Run this function once to install the trigger
 */
function installTrigger() {
  const folder = DriveApp.getFolderById(ACADEMIC_PAPERS_FOLDER_ID);
  
  // Create trigger for folder changes
  ScriptApp.newTrigger('onDriveChange')
    .timeBased()
    .everyMinutes(5) // Check every 5 minutes
    .create();
    
  console.log('Drive monitoring trigger installed');
}

/**
 * Main function that runs on timer to check for new folders
 */
function onDriveChange() {
  try {
    const folder = DriveApp.getFolderById(ACADEMIC_PAPERS_FOLDER_ID);
    const subfolders = folder.getFolders();
    
    while (subfolders.hasNext()) {
      const subfolder = subfolders.next();
      const folderName = subfolder.getName();
      const folderId = subfolder.getId();
      
      // Check if this folder has been processed
      if (!hasBeenProcessed(folderId)) {
        console.log(`New folder detected: ${folderName}`);
        
        // Check if folder contains required PDF file
        const files = getFilesInFolder(subfolder);
        if (files.pdf) {
          sendWebhookNotification(folderName, folderId, files);
          markAsProcessed(folderId);
        } else {
          console.log(`Folder ${folderName} missing required PDF file`);
        }
      }
    }
  } catch (error) {
    console.error('Error in onDriveChange:', error);
  }
}

/**
 * Get PDF file from a folder
 */
function getFilesInFolder(folder) {
  const files = { pdf: null };
  const fileIterator = folder.getFiles();
  
  while (fileIterator.hasNext()) {
    const file = fileIterator.next();
    const fileName = file.getName().toLowerCase();
    
    if (fileName.endsWith('.pdf')) {
      files.pdf = {
        name: file.getName(),
        id: file.getId(),
        downloadUrl: file.getDownloadUrl()
      };
      break; // Found PDF, stop looking
    }
  }
  
  return files;
}

/**
 * Send webhook notification to Make.com
 */
function sendWebhookNotification(folderName, folderId, files) {
  const payload = {
    event: 'new_paper_uploaded',
    timestamp: new Date().toISOString(),
    folder: {
      name: folderName,
      id: folderId,
      url: `https://drive.google.com/drive/folders/${folderId}`
    },
    files: files
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    console.log(`Webhook sent for ${folderName}. Response: ${response.getResponseCode()}`);
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

/**
 * Check if folder has been processed using PropertiesService
 */
function hasBeenProcessed(folderId) {
  const properties = PropertiesService.getScriptProperties();
  return properties.getProperty(`processed_${folderId}`) === 'true';
}

/**
 * Mark folder as processed
 */
function markAsProcessed(folderId) {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty(`processed_${folderId}`, 'true');
}

/**
 * Reset all processed folders (for testing)
 */
function resetProcessedFolders() {
  const properties = PropertiesService.getScriptProperties();
  properties.deleteAllProperties();
  console.log('All processed folder records cleared');
}