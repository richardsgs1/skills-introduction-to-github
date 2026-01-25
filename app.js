// Networking Tracker App - Main JavaScript

// Data Management
class NetworkingTracker {
    constructor() {
        this.contacts = this.loadFromStorage('contacts') || [];
        this.sessions = this.loadFromStorage('sessions') || [];
        this.currentContactId = null;
        this.currentSessionId = null;
        this.deleteCallback = null;

        this.init();
    }

    // Initialize the app
    init() {
        this.bindEvents();
        this.renderContacts();
        this.renderSessions();
        this.updateFilterOptions();
        this.updateContactDropdown();
        this.updateDatalistOptions();
    }

    // Local Storage Operations
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(`networkingTracker_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error loading ${key} from storage:`, error);
            return null;
        }
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(`networkingTracker_${key}`, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving ${key} to storage:`, error);
        }
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Event Binding
    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Add buttons
        document.getElementById('add-contact-btn').addEventListener('click', () => this.openContactModal());
        document.getElementById('add-session-btn').addEventListener('click', () => this.openSessionModal());

        // Form submissions
        document.getElementById('contact-form').addEventListener('submit', (e) => this.handleContactSubmit(e));
        document.getElementById('session-form').addEventListener('submit', (e) => this.handleSessionSubmit(e));

        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAllModals();
            });
        });

        // Delete confirmation
        document.getElementById('confirm-delete-btn').addEventListener('click', () => {
            if (this.deleteCallback) {
                this.deleteCallback();
                this.closeAllModals();
            }
        });

        // Search inputs
        document.getElementById('search-contacts').addEventListener('input', () => this.renderContacts());
        document.getElementById('search-sessions').addEventListener('input', () => this.renderSessions());

        // Filter and sort changes
        document.getElementById('filter-profession').addEventListener('change', () => this.renderContacts());
        document.getElementById('filter-location').addEventListener('change', () => this.renderContacts());
        document.getElementById('filter-interest').addEventListener('change', () => this.renderContacts());
        document.getElementById('sort-contacts').addEventListener('change', () => this.renderContacts());
        document.getElementById('sort-sessions').addEventListener('change', () => this.renderSessions());

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllModals();
        });
    }

    // Tab Switching
    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    // Modal Operations
    openContactModal(contact = null) {
        const modal = document.getElementById('contact-modal');
        const title = document.getElementById('contact-modal-title');
        const form = document.getElementById('contact-form');

        form.reset();

        if (contact) {
            title.textContent = 'Edit Contact';
            document.getElementById('contact-id').value = contact.id;
            document.getElementById('contact-name').value = contact.name;
            document.getElementById('contact-email').value = contact.email || '';
            document.getElementById('contact-phone').value = contact.phone || '';
            document.getElementById('contact-company').value = contact.company || '';
            document.getElementById('contact-profession').value = contact.profession;
            document.getElementById('contact-location').value = contact.location;
            document.getElementById('contact-interests').value = contact.interests.join(', ');
            document.getElementById('contact-linkedin').value = contact.linkedin || '';
            document.getElementById('contact-notes').value = contact.notes || '';
        } else {
            title.textContent = 'Add New Contact';
            document.getElementById('contact-id').value = '';
        }

        modal.classList.add('active');
        document.getElementById('contact-name').focus();
    }

    openSessionModal(session = null) {
        const modal = document.getElementById('session-modal');
        const title = document.getElementById('session-modal-title');
        const form = document.getElementById('session-form');

        this.updateContactDropdown();
        form.reset();

        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('session-date').value = today;

        if (session) {
            title.textContent = 'Edit Session';
            document.getElementById('session-id').value = session.id;
            document.getElementById('session-contact').value = session.contactId;
            document.getElementById('session-date').value = session.date;
            document.getElementById('session-type').value = session.type;
            document.getElementById('session-location').value = session.location || '';
            document.getElementById('session-duration').value = session.duration || '';
            document.getElementById('session-topics').value = session.topics || '';
            document.getElementById('session-notes').value = session.notes;
            document.getElementById('session-followup').value = session.followup || '';
        } else {
            title.textContent = 'Add New Session';
            document.getElementById('session-id').value = '';
        }

        modal.classList.add('active');
        document.getElementById('session-contact').focus();
    }

    openContactDetailModal(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;

        const modal = document.getElementById('contact-detail-modal');
        const content = document.getElementById('contact-detail-content');
        const contactSessions = this.sessions.filter(s => s.contactId === contactId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        content.innerHTML = `
            <div class="contact-detail-header">
                <div class="contact-detail-info">
                    <h2>${this.escapeHtml(contact.name)}</h2>
                    ${contact.company ? `<div class="contact-detail-company">${this.escapeHtml(contact.company)}</div>` : ''}
                </div>
                <div class="contact-detail-actions">
                    <button class="btn btn-primary btn-small" onclick="app.openSessionModalForContact('${contact.id}')">+ Add Session</button>
                    <button class="btn btn-secondary btn-small" onclick="app.closeAllModals(); app.openContactModal(app.contacts.find(c => c.id === '${contact.id}'))">Edit</button>
                </div>
            </div>

            <div class="contact-detail-section">
                <h3>Contact Information</h3>
                <div class="contact-detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Profession</div>
                        <div class="detail-value">${this.escapeHtml(contact.profession)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Location</div>
                        <div class="detail-value">${this.escapeHtml(contact.location)}</div>
                    </div>
                    ${contact.email ? `
                        <div class="detail-item">
                            <div class="detail-label">Email</div>
                            <div class="detail-value"><a href="mailto:${this.escapeHtml(contact.email)}">${this.escapeHtml(contact.email)}</a></div>
                        </div>
                    ` : ''}
                    ${contact.phone ? `
                        <div class="detail-item">
                            <div class="detail-label">Phone</div>
                            <div class="detail-value"><a href="tel:${this.escapeHtml(contact.phone)}">${this.escapeHtml(contact.phone)}</a></div>
                        </div>
                    ` : ''}
                    ${contact.linkedin ? `
                        <div class="detail-item">
                            <div class="detail-label">LinkedIn</div>
                            <div class="detail-value"><a href="${this.escapeHtml(contact.linkedin)}" target="_blank">View Profile</a></div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="contact-detail-section">
                <h3>Interest Areas</h3>
                <div class="contact-interests">
                    ${contact.interests.map(interest => `<span class="interest-tag">${this.escapeHtml(interest)}</span>`).join('')}
                </div>
            </div>

            ${contact.notes ? `
                <div class="contact-detail-section">
                    <h3>Notes</h3>
                    <div class="contact-notes-content">${this.escapeHtml(contact.notes)}</div>
                </div>
            ` : ''}

            <div class="contact-detail-section">
                <h3>Meeting History (${contactSessions.length})</h3>
                ${contactSessions.length > 0 ? `
                    <div class="contact-sessions-list">
                        ${contactSessions.map(session => `
                            <div class="mini-session-card">
                                <div class="mini-session-header">
                                    <span class="mini-session-date">${this.formatDate(session.date)}</span>
                                    <span class="mini-session-type">${this.escapeHtml(session.type)}</span>
                                </div>
                                <div class="mini-session-notes">${this.escapeHtml(session.notes)}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="empty-state">No meetings recorded yet.</p>'}
            </div>
        `;

        modal.classList.add('active');
    }

    openSessionModalForContact(contactId) {
        this.closeAllModals();
        this.openSessionModal();
        document.getElementById('session-contact').value = contactId;
    }

    openDeleteModal(message, callback) {
        document.getElementById('delete-message').textContent = message;
        this.deleteCallback = callback;
        document.getElementById('delete-modal').classList.add('active');
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.deleteCallback = null;
    }

    // Contact CRUD Operations
    handleContactSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('contact-id').value;
        const contactData = {
            name: document.getElementById('contact-name').value.trim(),
            email: document.getElementById('contact-email').value.trim(),
            phone: document.getElementById('contact-phone').value.trim(),
            company: document.getElementById('contact-company').value.trim(),
            profession: document.getElementById('contact-profession').value.trim(),
            location: document.getElementById('contact-location').value.trim(),
            interests: document.getElementById('contact-interests').value
                .split(',')
                .map(i => i.trim())
                .filter(i => i),
            linkedin: document.getElementById('contact-linkedin').value.trim(),
            notes: document.getElementById('contact-notes').value.trim()
        };

        if (id) {
            // Update existing contact
            const index = this.contacts.findIndex(c => c.id === id);
            if (index !== -1) {
                this.contacts[index] = { ...this.contacts[index], ...contactData };
            }
        } else {
            // Add new contact
            this.contacts.push({
                id: this.generateId(),
                ...contactData,
                dateAdded: new Date().toISOString()
            });
        }

        this.saveToStorage('contacts', this.contacts);
        this.closeAllModals();
        this.renderContacts();
        this.updateFilterOptions();
        this.updateContactDropdown();
        this.updateDatalistOptions();
    }

    deleteContact(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (!contact) return;

        this.openDeleteModal(
            `Are you sure you want to delete "${contact.name}"? This will also delete all associated sessions.`,
            () => {
                this.contacts = this.contacts.filter(c => c.id !== id);
                this.sessions = this.sessions.filter(s => s.contactId !== id);
                this.saveToStorage('contacts', this.contacts);
                this.saveToStorage('sessions', this.sessions);
                this.renderContacts();
                this.renderSessions();
                this.updateFilterOptions();
                this.updateContactDropdown();
            }
        );
    }

    // Session CRUD Operations
    handleSessionSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('session-id').value;
        const sessionData = {
            contactId: document.getElementById('session-contact').value,
            date: document.getElementById('session-date').value,
            type: document.getElementById('session-type').value,
            location: document.getElementById('session-location').value.trim(),
            duration: document.getElementById('session-duration').value,
            topics: document.getElementById('session-topics').value.trim(),
            notes: document.getElementById('session-notes').value.trim(),
            followup: document.getElementById('session-followup').value.trim()
        };

        if (id) {
            // Update existing session
            const index = this.sessions.findIndex(s => s.id === id);
            if (index !== -1) {
                this.sessions[index] = { ...this.sessions[index], ...sessionData };
            }
        } else {
            // Add new session
            this.sessions.push({
                id: this.generateId(),
                ...sessionData,
                createdAt: new Date().toISOString()
            });
        }

        this.saveToStorage('sessions', this.sessions);
        this.closeAllModals();
        this.renderSessions();
    }

    deleteSession(id) {
        const session = this.sessions.find(s => s.id === id);
        if (!session) return;

        const contact = this.contacts.find(c => c.id === session.contactId);
        const contactName = contact ? contact.name : 'Unknown Contact';

        this.openDeleteModal(
            `Are you sure you want to delete this session with "${contactName}"?`,
            () => {
                this.sessions = this.sessions.filter(s => s.id !== id);
                this.saveToStorage('sessions', this.sessions);
                this.renderSessions();
            }
        );
    }

    // Rendering
    renderContacts() {
        const container = document.getElementById('contacts-list');
        const searchTerm = document.getElementById('search-contacts').value.toLowerCase();
        const filterProfession = document.getElementById('filter-profession').value;
        const filterLocation = document.getElementById('filter-location').value;
        const filterInterest = document.getElementById('filter-interest').value;
        const sortBy = document.getElementById('sort-contacts').value;

        let filteredContacts = this.contacts.filter(contact => {
            const matchesSearch =
                contact.name.toLowerCase().includes(searchTerm) ||
                contact.company?.toLowerCase().includes(searchTerm) ||
                contact.profession.toLowerCase().includes(searchTerm) ||
                contact.interests.some(i => i.toLowerCase().includes(searchTerm));

            const matchesProfession = !filterProfession || contact.profession === filterProfession;
            const matchesLocation = !filterLocation || contact.location === filterLocation;
            const matchesInterest = !filterInterest || contact.interests.includes(filterInterest);

            return matchesSearch && matchesProfession && matchesLocation && matchesInterest;
        });

        // Sort contacts
        filteredContacts.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'profession':
                    return a.profession.localeCompare(b.profession);
                case 'location':
                    return a.location.localeCompare(b.location);
                case 'dateAdded':
                    return new Date(b.dateAdded) - new Date(a.dateAdded);
                default:
                    return 0;
            }
        });

        if (filteredContacts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>${this.contacts.length === 0 ? 'No contacts yet' : 'No matching contacts'}</h3>
                    <p>${this.contacts.length === 0 ? 'Add your first contact to get started!' : 'Try adjusting your filters or search term.'}</p>
                    ${this.contacts.length === 0 ? '<button class="btn btn-primary" onclick="app.openContactModal()">+ Add Contact</button>' : ''}
                </div>
            `;
            return;
        }

        container.innerHTML = filteredContacts.map(contact => `
            <div class="contact-card" onclick="app.openContactDetailModal('${contact.id}')">
                <div class="contact-card-header">
                    <div>
                        <div class="contact-name">${this.escapeHtml(contact.name)}</div>
                        ${contact.company ? `<div class="contact-company">${this.escapeHtml(contact.company)}</div>` : ''}
                    </div>
                    <div class="contact-card-actions" onclick="event.stopPropagation()">
                        <button class="btn btn-secondary btn-small" onclick="app.openContactModal(app.contacts.find(c => c.id === '${contact.id}'))">Edit</button>
                        <button class="btn btn-danger btn-small" onclick="app.deleteContact('${contact.id}')">Delete</button>
                    </div>
                </div>
                <div class="contact-meta">
                    <div class="meta-item">
                        <span>💼</span>
                        <span>${this.escapeHtml(contact.profession)}</span>
                    </div>
                    <div class="meta-item">
                        <span>📍</span>
                        <span>${this.escapeHtml(contact.location)}</span>
                    </div>
                    <div class="meta-item">
                        <span>📅</span>
                        <span>${this.getSessionCount(contact.id)} sessions</span>
                    </div>
                </div>
                <div class="contact-interests">
                    ${contact.interests.slice(0, 5).map(interest => `<span class="interest-tag">${this.escapeHtml(interest)}</span>`).join('')}
                    ${contact.interests.length > 5 ? `<span class="interest-tag">+${contact.interests.length - 5} more</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    renderSessions() {
        const container = document.getElementById('sessions-list');
        const searchTerm = document.getElementById('search-sessions').value.toLowerCase();
        const sortBy = document.getElementById('sort-sessions').value;

        let filteredSessions = this.sessions.filter(session => {
            const contact = this.contacts.find(c => c.id === session.contactId);
            const contactName = contact ? contact.name.toLowerCase() : '';

            return session.notes.toLowerCase().includes(searchTerm) ||
                   session.type.toLowerCase().includes(searchTerm) ||
                   session.topics?.toLowerCase().includes(searchTerm) ||
                   contactName.includes(searchTerm);
        });

        // Sort sessions
        filteredSessions.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.date) - new Date(a.date);
                case 'dateOld':
                    return new Date(a.date) - new Date(b.date);
                case 'contact':
                    const contactA = this.contacts.find(c => c.id === a.contactId);
                    const contactB = this.contacts.find(c => c.id === b.contactId);
                    return (contactA?.name || '').localeCompare(contactB?.name || '');
                default:
                    return 0;
            }
        });

        if (filteredSessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>${this.sessions.length === 0 ? 'No sessions yet' : 'No matching sessions'}</h3>
                    <p>${this.sessions.length === 0 ? 'Record your first networking session!' : 'Try adjusting your search term.'}</p>
                    ${this.sessions.length === 0 && this.contacts.length > 0 ? '<button class="btn btn-primary" onclick="app.openSessionModal()">+ Add Session</button>' : ''}
                    ${this.contacts.length === 0 ? '<p>Add a contact first to record sessions.</p>' : ''}
                </div>
            `;
            return;
        }

        container.innerHTML = filteredSessions.map(session => {
            const contact = this.contacts.find(c => c.id === session.contactId);
            return `
                <div class="session-card">
                    <div class="session-card-header">
                        <div>
                            <div class="session-contact-name">${contact ? this.escapeHtml(contact.name) : 'Unknown Contact'}</div>
                            <div class="session-date">${this.formatDate(session.date)}${session.duration ? ` • ${session.duration} min` : ''}</div>
                        </div>
                        <span class="session-type-badge">${this.escapeHtml(session.type)}</span>
                    </div>
                    ${session.topics ? `<div class="meta-item"><span>💬</span> ${this.escapeHtml(session.topics)}</div>` : ''}
                    <div class="session-notes-preview">${this.escapeHtml(session.notes)}</div>
                    ${session.followup ? `<div class="meta-item" style="margin-top: 10px;"><span>📌</span> Follow-up: ${this.escapeHtml(session.followup)}</div>` : ''}
                    <div class="session-card-actions">
                        <button class="btn btn-secondary btn-small" onclick="app.openSessionModal(app.sessions.find(s => s.id === '${session.id}'))">Edit</button>
                        <button class="btn btn-danger btn-small" onclick="app.deleteSession('${session.id}')">Delete</button>
                        ${contact ? `<button class="btn btn-primary btn-small" onclick="app.openContactDetailModal('${contact.id}')">View Contact</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update filter dropdowns
    updateFilterOptions() {
        const professions = [...new Set(this.contacts.map(c => c.profession))].sort();
        const locations = [...new Set(this.contacts.map(c => c.location))].sort();
        const interests = [...new Set(this.contacts.flatMap(c => c.interests))].sort();

        this.updateSelectOptions('filter-profession', professions, 'All Professions');
        this.updateSelectOptions('filter-location', locations, 'All Locations');
        this.updateSelectOptions('filter-interest', interests, 'All Interests');
    }

    updateSelectOptions(selectId, options, defaultLabel) {
        const select = document.getElementById(selectId);
        const currentValue = select.value;

        select.innerHTML = `<option value="">${defaultLabel}</option>` +
            options.map(opt => `<option value="${this.escapeHtml(opt)}">${this.escapeHtml(opt)}</option>`).join('');

        if (options.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    updateContactDropdown() {
        const select = document.getElementById('session-contact');
        const currentValue = select.value;

        select.innerHTML = '<option value="">Select a contact</option>' +
            this.contacts
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`)
                .join('');

        if (this.contacts.find(c => c.id === currentValue)) {
            select.value = currentValue;
        }
    }

    updateDatalistOptions() {
        const professions = [...new Set(this.contacts.map(c => c.profession))].sort();
        const locations = [...new Set(this.contacts.map(c => c.location))].sort();

        document.getElementById('professions-list').innerHTML =
            professions.map(p => `<option value="${this.escapeHtml(p)}">`).join('');

        document.getElementById('locations-list').innerHTML =
            locations.map(l => `<option value="${this.escapeHtml(l)}">`).join('');
    }

    // Utility methods
    getSessionCount(contactId) {
        return this.sessions.filter(s => s.contactId === contactId).length;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NetworkingTracker();
});
