// contentScript.js - Enhanced Version with Debug Logs

// Fallback to ensure initializeExtension runs in case DOMContentLoaded doesn't fire correctly.
setTimeout(() => {
  if (!window.extensionInitialized) {
    console.log('Fallback: Manually initializing extension after delay...');
    initializeExtension();
  }
}, 2000);

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', initializeExtension);

function initializeExtension() {
  console.log('Initializing extension...');
  window.extensionInitialized = true; // To prevent duplicate initialization
  // Check if we're on the correct page
  const urlPattern = /^https:\/\/chatgpt\.com(\/|$)/;
  if (urlPattern.test(window.location.href)) {
    console.log('URL matches the expected pattern, proceeding...');
    // Initialize the folder UI
    observeSidebar();
    // Fallback: try to inject UI after 2 seconds if not done by MutationObserver
    setTimeout(() => {
      console.log('Fallback attempt to initialize folder UI...');
      injectFolderUI();
    }, 2000);
  } else {
    console.error('URL does not match the expected pattern. Script will not proceed.');
  }
}

function observeSidebar() {
  console.log('Starting MutationObserver to detect sidebar...');
  const observer = new MutationObserver((mutations, obs) => {
    console.log('MutationObserver triggered...');
    const sidebar = document.querySelector('nav[aria-label="Chat history"]');
    if (sidebar) {
      console.log('Sidebar found by MutationObserver, initializing folder UI...');
      obs.disconnect();
      injectFolderUI();
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true
  });
}

function injectFolderUI() {
  console.log('Injecting folder UI...');
  // Find the sidebar where conversations are listed
  const sidebar = document.querySelector('nav[aria-label="Chat history"]'); // Update the selector if needed

  if (!sidebar) {
    console.error('Sidebar not found');
    return;
  }

  // Check if the folder UI has already been injected
  if (document.getElementById('chatgpt-folder-container')) {
    console.log('Folder UI already injected, skipping...');
    return;
  }

  // Create a container for folders
  const folderContainer = document.createElement('div');
  folderContainer.id = 'chatgpt-folder-container';
  folderContainer.style.padding = '10px';
  folderContainer.style.borderBottom = '1px solid #ccc';

  // Insert the folder container at the top of the sidebar
  sidebar.prepend(folderContainer);

  // Load folders from storage and display them
  loadFolders().then((folders) => {
    console.log('Loaded folders from storage:', folders);
    folders.forEach((folder) => {
      console.log('Creating folder element for:', folder);
      const folderElement = createFolderElement(folder);
      folderContainer.appendChild(folderElement);
    });

    // Load and display conversations assigned to folders
    loadConversationFolders().then((convFolders) => {
      console.log('Loaded conversation-folder assignments:', convFolders);
      Object.entries(convFolders).forEach(([convId, folderId]) => {
        const folderChatContainer = document.querySelector(`[data-folder-id="${folderId}"] .chatgpt-folder-chats`);
        const conversationElement = document.querySelector(`a[data-conversation-id="${convId}"]`);
        
        if (folderChatContainer && conversationElement) {
          folderChatContainer.appendChild(conversationElement);
          conversationElement.style.display = 'block';
          conversationElement.style.marginLeft = '10px';
        } else {
          console.warn(`Failed to find folder or conversation for ID: ${convId}`);
        }
      });
    });

  });

  // Add a button to create new folders
  const addFolderButton = document.createElement('button');
  addFolderButton.id = 'add-folder-button';
  addFolderButton.textContent = '+ New Folder';
  addFolderButton.style.marginTop = '10px';
  addFolderButton.style.width = '100%';
  addFolderButton.style.cursor = 'pointer';
  addFolderButton.style.backgroundColor = '#007bff';
  addFolderButton.style.color = '#ffffff';
  addFolderButton.style.border = 'none';
  addFolderButton.style.padding = '10px';
  addFolderButton.style.fontWeight = 'bold';
  addFolderButton.style.borderRadius = '4px';
  addFolderButton.addEventListener('click', () => {
    console.log('Add Folder button clicked');
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      console.log('Adding new folder with name:', folderName);
      addFolder(folderName);
    }
  });

  folderContainer.appendChild(addFolderButton);

  // Add a button to clear all folders and conversations
  const clearAllButton = document.createElement('button');
  clearAllButton.id = 'clear-all-button';
  clearAllButton.textContent = 'Clear Everything';
  clearAllButton.style.marginTop = '10px';
  clearAllButton.style.width = '100%';
  clearAllButton.style.cursor = 'pointer';
  clearAllButton.style.backgroundColor = '#ff0000';
  clearAllButton.style.color = '#ffffff';
  clearAllButton.style.border = 'none';
  clearAllButton.style.padding = '10px';
  clearAllButton.style.fontWeight = 'bold';
  clearAllButton.style.borderRadius = '4px';
  clearAllButton.addEventListener('click', () => {
    console.log('Clear Everything button clicked');
    if (confirm('Are you sure you want to delete all folders and conversations? This action cannot be undone.')) {
      clearAllFoldersAndConversations();
    }
  });

  folderContainer.appendChild(clearAllButton);



  // Make conversation items draggable
  makeConversationsDraggable();
}

function clearAllFoldersAndConversations() {
  console.log('Clearing all folders and conversation assignments...');
  // Clear folders from storage
  chrome.storage.sync.set({ folders: [] }, () => {
    console.log('All folders cleared from storage.');
    // Clear conversation-folder assignments from storage
    chrome.storage.sync.set({ conversationFolders: {} }, () => {
      console.log('All conversation-folder assignments cleared from storage.');
      // Clear folder elements from UI
      const folderContainer = document.getElementById('chatgpt-folder-container');
      if (folderContainer) {
        folderContainer.innerHTML = ''; // Remove all folder elements
      }
    });
  });
}

function createFolderElement(folder) {
  console.log('Creating folder element for folder:', folder);
  const folderElement = document.createElement('div');
  folderElement.className = 'chatgpt-folder';
  folderElement.dataset.folderId = folder.id;
  folderElement.style.padding = '10px';
  folderElement.style.cursor = 'pointer';
  folderElement.style.border = '1px solid #ddd';
  folderElement.style.marginBottom = '5px';
  folderElement.style.borderRadius = '4px';
  folderElement.style.backgroundColor = '#000'; // Changed to black
  folderElement.style.color = '#fff'; // Changed to white
  folderElement.style.fontWeight = 'bold';
  folderElement.style.fontSize = '14px';

  // Add a folder name label
  const folderLabel = document.createElement('div');
  folderLabel.textContent = folder.name;
  folderLabel.style.marginBottom = '5px';
  folderElement.appendChild(folderLabel);

  // Container for the chats inside the folder
  const chatContainer = document.createElement('div');
  chatContainer.className = 'chatgpt-folder-chats';
  chatContainer.style.display = 'block';
  chatContainer.style.paddingLeft = '10px'; // Indent the chats for better visualization
  folderElement.appendChild(chatContainer);

  // Event listener to toggle folder collapse/uncollapse
  folderLabel.addEventListener('click', () => {
    console.log('Toggling folder collapse for:', folder.name);
    const isCollapsed = folderElement.dataset.collapsed === 'true';
    folderElement.dataset.collapsed = !isCollapsed;
    chatContainer.style.display = isCollapsed ? 'none' : 'block';
  });

  // Allow folders to accept dropped items
  folderElement.addEventListener('dragover', (event) => {
    event.preventDefault();
    folderElement.style.backgroundColor = '#e0e0e0'; // Visual feedback
  });

  folderElement.addEventListener('dragleave', () => {
    folderElement.style.backgroundColor = '#f9f9f9'; // Reset background color
  });

  folderElement.addEventListener('drop', (event) => {
    event.preventDefault();
    const conversationId = event.dataTransfer.getData('text/plain');
    if (conversationId) {
      console.log('Dropped conversation:', conversationId, 'into folder:', folder.name);
      assignConversationToFolder(conversationId, folder.id);
    }
    folderElement.style.backgroundColor = '#f9f9f9';
  });

  // Right-click event to rename or delete a folder
  folderElement.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    console.log('Context menu opened for folder:', folder.name);
    const action = prompt(`Actions for folder "${folder.name}":\n1. Rename\n2. Delete`);
    if (action === '1') {
      const newName = prompt('Enter new folder name:');
      if (newName) {
        console.log('Renaming folder:', folder.name, 'to:', newName);
        renameFolder(folder.id, newName);
      }
    } else if (action === '2') {
      console.log('Deleting folder:', folder.name);
      deleteFolder(folder.id);
    }
  });

  return folderElement;
}

function addFolder(name) {
  console.log('Adding folder with name:', name);
  loadFolders().then((folders) => {
    const newFolder = {
      id: 'folder-' + Date.now(),
      name: name,
    };
    folders.push(newFolder);
    saveFolders(folders).then(() => {
      console.log('Folder saved, adding to UI:', newFolder);
      const folderContainer = document.getElementById('chatgpt-folder-container');
      const folderElement = createFolderElement(newFolder);
      folderContainer.insertBefore(folderElement, document.getElementById('add-folder-button'));
    });
  });
}

function renameFolder(folderId, newName) {
  console.log('Renaming folder with ID:', folderId, 'to new name:', newName);
  loadFolders().then((folders) => {
    const folder = folders.find((f) => f.id === folderId);
    if (folder) {
      folder.name = newName;
      saveFolders(folders).then(() => {
        console.log('Folder renamed in storage, updating UI for folder ID:', folderId);
        document.querySelector(`[data-folder-id="${folderId}"] div`).textContent = newName;
      });
    }
  });
}

function deleteFolder(folderId) {
  console.log('Deleting folder with ID:', folderId);
  loadFolders().then((folders) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    saveFolders(updatedFolders).then(() => {
      console.log('Folder deleted from storage, removing from UI for folder ID:', folderId);
      const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`);
      if (folderElement) {
        folderElement.remove();
      }
    });
  });
}

function makeConversationsDraggable() {
  console.log('Making conversations draggable...');
  const conversationItems = document.querySelectorAll('nav[aria-label="Chat history"] a'); // Update selector if necessary
  if (conversationItems.length === 0) {
    console.warn('No conversation items found to make draggable.');
  }
  conversationItems.forEach((item) => {
    const conversationId = item.href.split('/').pop(); // Extracting conversation ID from URL
    item.dataset.conversationId = conversationId; // Assigning conversation ID as a data attribute
    item.draggable = true;
    item.addEventListener('dragstart', (event) => {
      console.log('Dragging conversation:', item.dataset.conversationId);
      event.dataTransfer.setData('text/plain', item.dataset.conversationId);
    });
  });
}

function assignConversationToFolder(conversationId, folderId) {
  console.log('Assigning conversation:', conversationId, 'to folder:', folderId);
  loadConversationFolders().then((convFolders) => {
    convFolders[conversationId] = folderId;
    saveConversationFolders(convFolders).then(() => {
      console.log(`Conversation ${conversationId} assigned to folder ${folderId}`);
      // Attach conversation to the folder element in the DOM
      const conversationElement = document.querySelector(`[data-conversation-id="${conversationId}"]`);
      if (conversationElement) {
        const folderChatContainer = document.querySelector(`[data-folder-id="${folderId}"] .chatgpt-folder-chats`);
        if (folderChatContainer) {
          console.log('Appending conversation element to folder chat container...');
          folderChatContainer.appendChild(conversationElement);
          conversationElement.style.display = 'block';
          conversationElement.style.marginLeft = '10px'; // Indent to differentiate from main conversations
        }
      } else {
        console.warn(`Conversation element with ID ${conversationId} not found in DOM.`);
      }
    });
  });
}

function filterConversationsByFolder(folderId) {
  console.log(`Filtering conversations by folder: ${folderId}`);
  loadConversationFolders().then((convFolders) => {
    const conversationItems = document.querySelectorAll('nav[aria-label="Chat history"] a'); // Update selector if necessary
    conversationItems.forEach((item) => {
      const convId = item.dataset.conversationId;
      if (convFolders[convId] === folderId) {
        console.log('Showing conversation:', convId);
        item.style.display = 'block';
      } else {
        console.log('Hiding conversation:', convId);
        item.style.display = 'none';
      }
    });
  });
}

// Storage Functions

function saveFolders(folders) {
  return new Promise((resolve) => {
    console.log('Saving folders to storage:', folders);
    chrome.storage.sync.set({ folders: folders }, () => {
      resolve();
    });
  });
}

function loadFolders() {
  return new Promise((resolve) => {
    console.log('Loading folders from storage...');
    chrome.storage.sync.get(['folders'], (result) => {
      console.log('Loaded folders from storage:', result.folders || []);
      resolve(result.folders || []);
    });
  });
}

/**
 * Saves the conversation folders to Chrome's synchronized storage.
 *
 * @param {Object} convFolders - The conversation folders to save.
 * @returns {Promise<void>} A promise that resolves when the folders have been saved.
 */
function saveConversationFolders(convFolders) {
  return new Promise((resolve) => {
    console.log('Saving conversation folders to storage:', convFolders);
    chrome.storage.sync.set({ conversationFolders: convFolders }, () => {
      resolve();
    });
  });
}

/**
 * Loads conversation folders from Chrome's synchronized storage.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing the conversation folders.
 */
function loadConversationFolders() {
  return new Promise((resolve) => {
    console.log('Loading conversation folders from storage...');
    chrome.storage.sync.get(['conversationFolders'], (result) => {
      console.log('Loaded conversation folders from storage:', result.conversationFolders || {});
      resolve(result.conversationFolders || {});
    });
  });
}

console.log('ChatGPT Organizer content script loaded - Enhanced Version with Debug Logs');
