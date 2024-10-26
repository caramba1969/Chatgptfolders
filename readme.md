# ChatGPT Organizer Extension

This project is a browser extension designed to organize ChatGPT conversations into folders. It provides a user-friendly interface to create, manage, and display folders and their associated conversations.

## Features

- **Folder Management**: Create, delete, and manage folders.
- **Conversation Assignment**: Assign conversations to specific folders.
- **Dark/Light Mode Support**: Automatically adapts to the user's preferred color scheme.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chatgpt-organizer-extension.git
   ```

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

