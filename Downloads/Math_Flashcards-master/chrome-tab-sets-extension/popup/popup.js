// State management
let tabSets = {};
let currentEditSet = null;

// DOM elements
const saveForm = document.getElementById('saveForm');
const setNameInput = document.getElementById('setName');
const setCategoryInput = document.getElementById('setCategory');
const useSyncCheckbox = document.getElementById('useSync');
const saveBtn = document.getElementById('saveBtn');
const tabSetsList = document.getElementById('tabSetsList');
const loadingIndicator = document.getElementById('loadingIndicator');
const emptyState = document.getElementById('emptyState');
const categoryFilter = document.getElementById('categoryFilter');

// Modal elements
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editNameInput = document.getElementById('editName');
const editCategoryInput = document.getElementById('editCategory');
const editUseSyncCheckbox = document.getElementById('editUseSync');
const editTabsList = document.getElementById('editTabsList');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveEditBtn = document.getElementById('saveEditBtn');

const importModal = document.getElementById('importModal');
const importDataTextarea = document.getElementById('importData');
const closeImportModal = document.getElementById('closeImportModal');
const cancelImportBtn = document.getElementById('cancelImportBtn');
const confirmImportBtn = document.getElementById('confirmImportBtn');
const importError = document.getElementById('importError');
const fileInput = document.getElementById('fileInput');

const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTabSets();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  // Save form
  saveForm.addEventListener('submit', handleSaveCurrentTabs);
  
  // Edit modal
  closeEditModal.addEventListener('click', closeEditModalHandler);
  cancelEditBtn.addEventListener('click', closeEditModalHandler);
  saveEditBtn.addEventListener('click', handleSaveEdit);
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModalHandler();
  });
  
  // Import modal
  closeImportModal.addEventListener('click', closeImportModalHandler);
  cancelImportBtn.addEventListener('click', closeImportModalHandler);
  confirmImportBtn.addEventListener('click', handleImport);
  importModal.addEventListener('click', (e) => {
    if (e.target === importModal) closeImportModalHandler();
  });
  
  // Import/Export buttons
  exportBtn.addEventListener('click', handleExport);
  importBtn.addEventListener('click', () => {
    // Offer both file selection and manual paste
    const useFile = confirm('Import from file? (Click OK for file, Cancel to paste JSON)');
    if (useFile) {
      fileInput.click();
    } else {
      importModal.style.display = 'flex';
      importDataTextarea.value = '';
      importError.style.display = 'none';
    }
  });
  
  // File input for import
  fileInput.addEventListener('change', handleFileImport);
  
  // Category filter
  categoryFilter.addEventListener('change', renderTabSets);
}

// Load tab sets from storage
async function loadTabSets() {
  try {
    loadingIndicator.style.display = 'block';
    emptyState.style.display = 'none';
    tabSetsList.innerHTML = '';
    
    const response = await chrome.runtime.sendMessage({ action: 'getAllTabSets' });
    
    // Check for runtime errors
    if (chrome.runtime.lastError) {
      console.error('Runtime error:', chrome.runtime.lastError);
      showError(`Error: ${chrome.runtime.lastError.message}`);
      return;
    }
    
    if (response && response.success) {
      tabSets = response.tabSets || {};
      updateCategoryFilter();
      renderTabSets();
    } else {
      showError(response?.error || 'Failed to load tab sets');
    }
  } catch (error) {
    console.error('Error loading tab sets:', error);
    showError(`Error loading tab sets: ${error.message}`);
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

// Update category filter dropdown
function updateCategoryFilter() {
  const categories = new Set();
  Object.values(tabSets).forEach(set => {
    if (set.category) {
      categories.add(set.category);
    }
  });
  
  const currentValue = categoryFilter.value;
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  
  Array.from(categories).sort().forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
  
  categoryFilter.value = currentValue;
  
  // Update datalist for edit form
  const categoryList = document.getElementById('categoryList');
  categoryList.innerHTML = '';
  Array.from(categories).sort().forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    categoryList.appendChild(option);
  });
}

// Render tab sets list
function renderTabSets() {
  tabSetsList.innerHTML = '';
  
  const selectedCategory = categoryFilter.value;
  const filteredSets = Object.values(tabSets).filter(set => {
    if (!selectedCategory) return true;
    return set.category === selectedCategory;
  });
  
  if (filteredSets.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  
  // Group by category
  const grouped = {};
  filteredSets.forEach(set => {
    const category = set.category || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(set);
  });
  
  // Sort categories
  const sortedCategories = Object.keys(grouped).sort();
  
  sortedCategories.forEach(category => {
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'category-group';
    
    const header = document.createElement('div');
    header.className = 'category-group-header';
    header.textContent = `${category} (${grouped[category].length})`;
    categoryGroup.appendChild(header);
    
    // Sort sets by name
    grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    
    grouped[category].forEach(set => {
      const setElement = createTabSetElement(set);
      categoryGroup.appendChild(setElement);
    });
    
    tabSetsList.appendChild(categoryGroup);
  });
}

// Create tab set element
function createTabSetElement(set) {
  const item = document.createElement('div');
  item.className = 'tab-set-item';
  
  const header = document.createElement('div');
  header.className = 'tab-set-header';
  
  const info = document.createElement('div');
  info.className = 'tab-set-info';
  
  const name = document.createElement('div');
  name.className = 'tab-set-name';
  name.textContent = set.name;
  info.appendChild(name);
  
  const meta = document.createElement('div');
  meta.className = 'tab-set-meta';
  
  const tabCount = document.createElement('span');
  tabCount.className = 'tab-count';
  tabCount.textContent = `${set.tabs?.length || 0} tabs`;
  meta.appendChild(tabCount);
  
  if (set.category) {
    const category = document.createElement('span');
    category.className = 'tab-set-category';
    category.textContent = set.category;
    meta.appendChild(category);
  }
  
  const lastUpdated = document.createElement('span');
  lastUpdated.textContent = formatDate(set.updatedAt || set.createdAt);
  meta.appendChild(lastUpdated);
  
  if (set.useSync) {
    const syncBadge = document.createElement('span');
    syncBadge.textContent = '☁️ Synced';
    syncBadge.style.fontSize = '11px';
    meta.appendChild(syncBadge);
  }
  
  info.appendChild(meta);
  header.appendChild(info);
  
  const actions = document.createElement('div');
  actions.className = 'tab-set-actions';
  
  const restoreBtn = document.createElement('button');
  restoreBtn.className = 'action-btn restore';
  restoreBtn.textContent = 'Restore';
  restoreBtn.addEventListener('click', () => handleRestore(set.id, set.useSync));
  actions.appendChild(restoreBtn);
  
  const editBtn = document.createElement('button');
  editBtn.className = 'action-btn';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => openEditModal(set));
  actions.appendChild(editBtn);
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'action-btn delete';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => handleDelete(set.id, set.useSync));
  actions.appendChild(deleteBtn);
  
  header.appendChild(actions);
  item.appendChild(header);
  
  return item;
}

// Format date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

// Handle save current tabs
async function handleSaveCurrentTabs(e) {
  e.preventDefault();
  
  const name = setNameInput.value.trim();
  if (!name) {
    alert('Please enter a name for the tab set');
    return;
  }
  
  const category = setCategoryInput.value.trim() || 'Uncategorized';
  const useSync = useSyncCheckbox.checked;
  
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'saveCurrentTabs',
      name,
      category,
      useSync
    });
    
    if (chrome.runtime.lastError) {
      showError(`Error: ${chrome.runtime.lastError.message}`);
      return;
    }
    
    if (response && response.success) {
      setNameInput.value = '';
      setCategoryInput.value = '';
      useSyncCheckbox.checked = false;
      await loadTabSets();
      showSuccess('Tab set saved successfully!');
    } else {
      showError(response?.error || 'Failed to save tab set');
    }
  } catch (error) {
    console.error('Error saving tabs:', error);
    showError(`Error saving tab set: ${error.message}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Tab Set';
  }
}

// Handle restore tab set
async function handleRestore(id, useSync) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'restoreTabSet',
      id,
      useSync
    });
    
    if (chrome.runtime.lastError) {
      showError(`Error: ${chrome.runtime.lastError.message}`);
      return;
    }
    
    if (response && response.success) {
      showSuccess('Tab set restored!');
      // Close popup after a brief delay to show success message
      setTimeout(() => {
        window.close();
      }, 500);
    } else {
      showError(response?.error || 'Failed to restore tab set');
    }
  } catch (error) {
    console.error('Error restoring tabs:', error);
    showError(`Error restoring tab set: ${error.message}`);
  }
}

// Handle delete tab set
async function handleDelete(id, useSync) {
  if (!confirm('Are you sure you want to delete this tab set?')) {
    return;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'deleteTabSet',
      id,
      useSync
    });
    
    if (chrome.runtime.lastError) {
      showError(`Error: ${chrome.runtime.lastError.message}`);
      return;
    }
    
    if (response && response.success) {
      await loadTabSets();
      showSuccess('Tab set deleted');
    } else {
      showError(response?.error || 'Failed to delete tab set');
    }
  } catch (error) {
    console.error('Error deleting tab set:', error);
    showError(`Error deleting tab set: ${error.message}`);
  }
}

// Open edit modal
async function openEditModal(set) {
  currentEditSet = set;
  
  editNameInput.value = set.name;
  editCategoryInput.value = set.category || '';
  editUseSyncCheckbox.checked = set.useSync || false;
  
  // Render tabs list
  editTabsList.innerHTML = '';
  if (set.tabs && set.tabs.length > 0) {
    const sortedTabs = [...set.tabs].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    sortedTabs.forEach((tab, index) => {
      const tabItem = document.createElement('div');
      tabItem.className = `tab-item-edit ${tab.active ? 'tab-item-active' : ''}`;
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.dataset.tabIndex = index;
      tabItem.appendChild(checkbox);
      
      const info = document.createElement('div');
      info.className = 'tab-item-info';
      
      const title = document.createElement('div');
      title.className = 'tab-item-title';
      title.textContent = tab.title || tab.url || 'Untitled';
      info.appendChild(title);
      
      const url = document.createElement('div');
      url.className = 'tab-item-url';
      url.textContent = tab.url || '';
      info.appendChild(url);
      
      tabItem.appendChild(info);
      
      const actions = document.createElement('div');
      actions.className = 'tab-item-actions';
      
      if (index > 0) {
        const upBtn = document.createElement('button');
        upBtn.className = 'tab-item-btn';
        upBtn.textContent = '↑';
        upBtn.title = 'Move up';
        upBtn.addEventListener('click', () => moveTabInEdit(index, -1));
        actions.appendChild(upBtn);
      }
      
      if (index < sortedTabs.length - 1) {
        const downBtn = document.createElement('button');
        downBtn.className = 'tab-item-btn';
        downBtn.textContent = '↓';
        downBtn.title = 'Move down';
        downBtn.addEventListener('click', () => moveTabInEdit(index, 1));
        actions.appendChild(downBtn);
      }
      
      const activeBtn = document.createElement('button');
      activeBtn.className = 'tab-item-btn';
      activeBtn.textContent = tab.active ? '★' : '☆';
      activeBtn.title = 'Set as active tab';
      activeBtn.addEventListener('click', () => toggleActiveTab(index));
      actions.appendChild(activeBtn);
      
      tabItem.appendChild(actions);
      editTabsList.appendChild(tabItem);
    });
  }
  
  editModal.style.display = 'flex';
}

// Move tab in edit list
function moveTabInEdit(index, direction) {
  if (!currentEditSet || !currentEditSet.tabs) return;
  
  const sortedTabs = [...currentEditSet.tabs].sort((a, b) => (a.order || 0) - (b.order || 0));
  const newIndex = index + direction;
  
  if (newIndex < 0 || newIndex >= sortedTabs.length) return;
  
  // Swap tabs
  [sortedTabs[index], sortedTabs[newIndex]] = [sortedTabs[newIndex], sortedTabs[index]];
  
  // Update orders
  sortedTabs.forEach((tab, i) => {
    tab.order = i;
  });
  
  currentEditSet.tabs = sortedTabs;
  openEditModal(currentEditSet); // Re-render
}

// Toggle active tab
function toggleActiveTab(index) {
  if (!currentEditSet || !currentEditSet.tabs) return;
  
  const sortedTabs = [...currentEditSet.tabs].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Remove active from all
  sortedTabs.forEach(tab => {
    tab.active = false;
  });
  
  // Set active on selected
  sortedTabs[index].active = true;
  
  currentEditSet.tabs = sortedTabs;
  openEditModal(currentEditSet); // Re-render
}

// Close edit modal
function closeEditModalHandler() {
  editModal.style.display = 'none';
  currentEditSet = null;
}

// Handle save edit
async function handleSaveEdit() {
  if (!currentEditSet) return;
  
  const name = editNameInput.value.trim();
  if (!name) {
    alert('Please enter a name');
    return;
  }
  
  const category = editCategoryInput.value.trim() || 'Uncategorized';
  const useSync = editUseSyncCheckbox.checked;
  
  // Get checked tabs (remove unchecked ones)
  const checkedTabs = [];
  const checkboxes = editTabsList.querySelectorAll('input[type="checkbox"]');
  
  const sortedTabs = [...currentEditSet.tabs].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  checkboxes.forEach((checkbox, index) => {
    if (checkbox.checked) {
      checkedTabs.push(sortedTabs[index]);
    }
  });
  
  if (checkedTabs.length === 0) {
    alert('At least one tab must be selected');
    return;
  }
  
  // Update orders
  checkedTabs.forEach((tab, index) => {
    tab.order = index;
  });
  
  currentEditSet.name = name;
  currentEditSet.category = category;
  currentEditSet.useSync = useSync;
  currentEditSet.tabs = checkedTabs;
  currentEditSet.updatedAt = Date.now();
  
  saveEditBtn.disabled = true;
  saveEditBtn.textContent = 'Saving...';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'updateTabSet',
      tabSet: currentEditSet,
      useSync
    });
    
    if (chrome.runtime.lastError) {
      showError(`Error: ${chrome.runtime.lastError.message}`);
      return;
    }
    
    if (response && response.success) {
      closeEditModalHandler();
      await loadTabSets();
      showSuccess('Tab set updated');
    } else {
      showError(response?.error || 'Failed to update tab set');
    }
  } catch (error) {
    console.error('Error updating tab set:', error);
    showError('Error updating tab set');
  } finally {
    saveEditBtn.disabled = false;
    saveEditBtn.textContent = 'Save Changes';
  }
}

// Handle export
function handleExport() {
  const exportData = Object.values(tabSets);
  const json = JSON.stringify(exportData, null, 2);
  
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tab-sets-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showSuccess('Tab sets exported!');
}

// Handle import
async function handleImport() {
  const jsonText = importDataTextarea.value.trim();
  
  if (!jsonText) {
    importError.textContent = 'Please paste JSON data or select a file';
    importError.style.display = 'block';
    return;
  }
  
  try {
    const importedSets = JSON.parse(jsonText);
    
    if (!Array.isArray(importedSets)) {
      throw new Error('Invalid format: expected an array of tab sets');
    }
    
    let imported = 0;
    let errors = [];
    
    for (const set of importedSets) {
      if (!set.id || !set.name || !set.tabs) {
        errors.push(`Skipping invalid tab set: ${set.name || 'unnamed'}`);
        continue;
      }
      
      // Generate new ID to avoid conflicts
      const newId = `tabset_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      set.id = newId;
      set.createdAt = set.createdAt || Date.now();
      set.updatedAt = Date.now();
      
      const response = await chrome.runtime.sendMessage({
        action: 'updateTabSet',
        tabSet: set,
        useSync: set.useSync || false
      });
      
      if (chrome.runtime.lastError) {
        errors.push(`Failed to import ${set.name}: ${chrome.runtime.lastError.message}`);
      } else if (response && response.success) {
        imported++;
      } else {
        errors.push(`Failed to import: ${set.name}`);
      }
    }
    
    if (imported > 0) {
      await loadTabSets();
      showSuccess(`Imported ${imported} tab set(s)`);
      closeImportModalHandler();
    }
    
    if (errors.length > 0) {
      importError.textContent = errors.join('\n');
      importError.style.display = 'block';
    }
  } catch (error) {
    importError.textContent = `Error: ${error.message}`;
    importError.style.display = 'block';
  }
}

// Handle file import
function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (event) => {
    importModal.style.display = 'flex';
    importDataTextarea.value = event.target.result;
    importError.style.display = 'none';
  };
  reader.onerror = () => {
    importError.textContent = 'Error reading file';
    importError.style.display = 'block';
  };
  reader.readAsText(file);
}

// Close import modal
function closeImportModalHandler() {
  importModal.style.display = 'none';
  importDataTextarea.value = '';
  importError.style.display = 'none';
  fileInput.value = '';
}

// Show success message
function showSuccess(message) {
  // Simple notification (could be enhanced with a toast library)
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4caf50;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 10000;
    font-size: 14px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Show error message
function showError(message) {
  alert(message); // Simple alert, could be enhanced
}
