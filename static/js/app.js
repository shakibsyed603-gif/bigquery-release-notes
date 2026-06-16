// BigQuery Release Notes Dashboard Frontend App

// State variables
let allReleaseUpdates = [];
let filteredUpdates = [];
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const btnRefresh = document.getElementById('btn-refresh');
const btnRetry = document.getElementById('btn-retry');
const searchInput = document.getElementById('search-input');
const notesList = document.getElementById('notes-list');
const loadingSpinner = document.getElementById('loading-spinner');
const errorCard = document.getElementById('error-card');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');

// Filter Chips
const filterAll = document.getElementById('filter-all');
const filterFeature = document.getElementById('filter-feature');
const filterChange = document.getElementById('filter-change');
const filterDeprecation = document.getElementById('filter-deprecation');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelTweet = document.getElementById('btn-cancel-tweet');
const btnSubmitTweet = document.getElementById('btn-submit-tweet');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');

// Fetch and render notes on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Refresh feed
    btnRefresh.addEventListener('click', fetchReleaseNotes);
    btnRetry.addEventListener('click', fetchReleaseNotes);

    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        applyFiltersAndSearch();
    });

    // Category filters
    const chips = [filterAll, filterFeature, filterChange, filterDeprecation];
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.getAttribute('data-filter');
            applyFiltersAndSearch();
        });
    });

    // Modal closing events
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelTweet.addEventListener('click', closeModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeModal();
        }
    });

    // Character counter for Twitter textarea
    tweetTextarea.addEventListener('input', updateCharCounter);
}

// Fetch Release Notes from backend API
async function fetchReleaseNotes() {
    // Show loading spinner, hide list and errors
    loadingSpinner.classList.remove('hidden');
    notesList.classList.add('hidden');
    errorCard.classList.add('hidden');
    emptyState.classList.add('hidden');
    
    // Animate spinner
    const spinIcon = btnRefresh.querySelector('.icon-spin-target');
    if (spinIcon) spinIcon.classList.add('spin');
    btnRefresh.disabled = true;

    try {
        const response = await fetch('/api/release-notes');
        const data = await response.json();
        
        if (data.success && data.notes) {
            processAndStoreUpdates(data.notes);
            applyFiltersAndSearch();
        } else {
            showError(data.error || 'Failed to fetch release notes.');
        }
    } catch (error) {
        showError('Network error occurred while fetching release notes.');
        console.error(error);
    } finally {
        loadingSpinner.classList.add('hidden');
        if (spinIcon) spinIcon.classList.remove('spin');
        btnRefresh.disabled = false;
    }
}

// Process feed entries: split daily logs into individual updates
function processAndStoreUpdates(entries) {
    allReleaseUpdates = [];
    
    entries.forEach(entry => {
        const parsedSubUpdates = parseEntryHTML(entry);
        allReleaseUpdates.push(...parsedSubUpdates);
    });
}

// Parse daily HTML logs into discrete updates based on <h3> elements
function parseEntryHTML(entry) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(entry.content, 'text/html');
    const children = Array.from(doc.body.children);
    
    // Fallback URL if entry has no link
    const notesLink = entry.link || 'https://cloud.google.com/bigquery/docs/release-notes';

    if (children.length === 0) {
        // If content is plain text or empty
        const rawText = entry.content.replace(/<[^>]*>/g, '').trim();
        return [{
            id: entry.id,
            date: entry.date,
            type: 'Feature', // default
            htmlContent: entry.content || '<p>No content details provided.</p>',
            rawText: rawText || 'Google BigQuery update.',
            link: notesLink
        }];
    }
    
    const subUpdates = [];
    let currentType = 'Feature'; // Default fallback type
    let currentHtml = '';
    let currentText = '';
    
    children.forEach(child => {
        const tag = child.tagName;
        if (tag === 'H3' || tag === 'H4') {
            // Push previous sub-update if it has contents
            if (currentHtml.trim()) {
                subUpdates.push({
                    id: `${entry.id}-${subUpdates.length}`,
                    date: entry.date,
                    type: currentType,
                    htmlContent: currentHtml,
                    rawText: currentText.trim(),
                    link: notesLink
                });
            }
            
            // Set type to the heading text (e.g. "Feature", "Change", "Deprecation")
            currentType = child.textContent.trim();
            currentHtml = '';
            currentText = '';
        } else {
            currentHtml += child.outerHTML;
            currentText += ' ' + child.textContent;
        }
    });
    
    // Push the remaining last sub-update
    if (currentHtml.trim()) {
        subUpdates.push({
            id: `${entry.id}-${subUpdates.length}`,
            date: entry.date,
            type: currentType,
            htmlContent: currentHtml,
            rawText: currentText.trim(),
            link: notesLink
        });
    }
    
    // Fallback if no h3 was found but body has elements
    if (subUpdates.length === 0 && children.length > 0) {
        subUpdates.push({
            id: entry.id,
            date: entry.date,
            type: 'Feature',
            htmlContent: doc.body.innerHTML,
            rawText: doc.body.textContent.trim(),
            link: notesLink
        });
    }
    
    return subUpdates;
}

// Normalize types to Feature, Change, Deprecation
function getNormalizedType(typeText) {
    const text = typeText.toLowerCase();
    if (text.includes('feature') || text.includes('new')) {
        return 'Feature';
    } else if (text.includes('deprecat') || text.includes('remove') || text.includes('break')) {
        return 'Deprecation';
    } else {
        return 'Change'; // Includes Changes, Fixes, Improvements, Security
    }
}

// Apply searches and category filters
function applyFiltersAndSearch() {
    filteredUpdates = allReleaseUpdates.filter(item => {
        // Apply category filter
        const normalized = getNormalizedType(item.type);
        const matchesCategory = (currentFilter === 'all') || 
                               (currentFilter === normalized.toLowerCase());
        
        // Apply text search
        const matchesSearch = !searchQuery || 
                             item.rawText.toLowerCase().includes(searchQuery) || 
                             item.type.toLowerCase().includes(searchQuery) ||
                             item.date.toLowerCase().includes(searchQuery);
        
        return matchesCategory && matchesSearch;
    });

    renderUpdatesList();
}

// Render filtered cards to UI
function renderUpdatesList() {
    notesList.innerHTML = '';
    
    if (filteredUpdates.length === 0) {
        notesList.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    notesList.classList.remove('hidden');
    
    filteredUpdates.forEach(update => {
        const normalizedType = getNormalizedType(update.type);
        const typeClass = `cat-${normalizedType.toLowerCase()}`;
        const badgeClass = `badge-${normalizedType.toLowerCase()}`;
        
        const card = document.createElement('article');
        card.className = `note-card ${typeClass}`;
        card.id = `card-${update.id}`;
        
        // Structure the Card HTML
        card.innerHTML = `
            <div class="note-header">
                <span class="note-date-badge">
                    <i data-lucide="calendar"></i>
                    <span>${formatDate(update.date)}</span>
                </span>
                <span class="badge ${badgeClass}">${update.type}</span>
            </div>
            <div class="note-body">
                ${update.htmlContent}
            </div>
            <div class="note-actions">
                <button class="btn btn-secondary btn-share-link" data-id="${update.id}">
                    <i data-lucide="copy"></i> Copy Link
                </button>
                <button class="btn btn-share btn-tweet-about" data-id="${update.id}">
                    <i data-lucide="twitter"></i> Tweet Update
                </button>
            </div>
        `;
        
        notesList.appendChild(card);
    });

    // Re-initialize Lucide Icons on newly rendered elements
    lucide.createIcons();
    
    // Register actions buttons
    registerCardActionEvents();
}

// Add copy & tweet event listeners to each card
function registerCardActionEvents() {
    // Copy Link button event
    notesList.querySelectorAll('.btn-share-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            const update = allReleaseUpdates.find(u => u.id === id);
            if (update) {
                navigator.clipboard.writeText(update.link).then(() => {
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = `<i data-lucide="check" style="color:#10b981;"></i> Copied!`;
                    lucide.createIcons();
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        lucide.createIcons();
                    }, 2000);
                });
            }
        });
    });

    // Tweet About button event
    notesList.querySelectorAll('.btn-tweet-about').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            const update = allReleaseUpdates.find(u => u.id === id);
            if (update) {
                openTweetModal(update);
            }
        });
    });
}

// Open tweet preview and composer modal
function openTweetModal(update) {
    // Generate default tweet text
    // Clean raw text to remove HTML structures
    let summaryText = update.rawText
        .replace(/\s+/g, ' ')
        .trim();
        
    // Truncate text to fit within limits
    const linkText = `\nRead: ${update.link}`;
    const tagsText = ` #BigQuery #GoogleCloud`;
    const maxTextLength = 280 - linkText.length - tagsText.length - 20; // safe margin
    
    if (summaryText.length > maxTextLength) {
        summaryText = summaryText.substring(0, maxTextLength) + '...';
    }
    
    const defaultTweet = `📢 BigQuery Update (${formatDate(update.date)}):\n"${summaryText}"${tagsText}${linkText}`;
    
    tweetTextarea.value = defaultTweet;
    updateCharCounter();
    
    // Open modal
    tweetModal.classList.add('active');
    tweetModal.setAttribute('aria-hidden', 'false');
    
    // Remove old events and set post action
    const oldBtn = btnSubmitTweet;
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    
    newBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank');
        closeModal();
    });
    
    // Lucide support for cloned button
    lucide.createIcons();
}

// Close composition modal
function closeModal() {
    tweetModal.classList.remove('active');
    tweetModal.setAttribute('aria-hidden', 'true');
}

// Character counter helper
function updateCharCounter() {
    const count = tweetTextarea.value.length;
    charCounter.textContent = count;
    
    const wrapper = charCounter.parentElement;
    if (count > 280) {
        wrapper.classList.add('warning');
        btnSubmitTweet.disabled = true;
    } else {
        wrapper.classList.remove('warning');
        btnSubmitTweet.disabled = false;
    }
}

// Error state helper
function showError(message) {
    errorMessage.textContent = message;
    errorCard.classList.remove('hidden');
    notesList.classList.add('hidden');
    emptyState.classList.add('hidden');
}

// Helper to format dates beautifully (e.g. "June 15, 2026")
function formatDate(dateStr) {
    if (!dateStr) return 'Recent Update';
    
    // Try to parse YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        
        const dateObj = new Date(year, monthIndex, day);
        if (!isNaN(dateObj.getTime())) {
            return dateObj.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        }
    }
    
    return dateStr; // fallback if already human-readable
}
