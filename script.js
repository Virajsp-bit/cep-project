
        // Global variables
        let currentUser = null;
        let isLoggedIn = false;
        let currentPage = 'dashboard';

        // Configuration
        const defaultConfig = {
            society_name: 'Bharati Vihar Societyy',
            admin_contact: '+91 98765 43210',
            welcome_message: 'Welcome to our society management portal'
        };

        // Initialize application
        document.addEventListener('DOMContentLoaded', async function() {
            await initializeElementSDK();
            setupEventListeners();
            checkAuthStatus();
        });

        // Initialize Element SDK
        async function initializeElementSDK() {
            if (window.elementSdk) {
                try {
                    await window.elementSdk.init({
                        defaultConfig: defaultConfig,
                        onConfigChange: async (config) => {
                            // Update UI based on config changes
                            const societyName = config.society_name || defaultConfig.society_name;
                            const adminContact = config.admin_contact || defaultConfig.admin_contact;
                            const welcomeMessage = config.welcome_message || defaultConfig.welcome_message;
                            
                            document.getElementById('societyNameHeader').textContent = societyName;
                            document.getElementById('loginSocietyName').textContent = societyName;
                            document.getElementById('adminContactFooter').textContent = `Admin: ${adminContact}`;
                            document.getElementById('welcomeMessage').textContent = welcomeMessage;
                        },
                        mapToCapabilities: (config) => ({
                            recolorables: [
                                {
                                    get: () => config.primary_color || '#3b82f6',
                                    set: (value) => {
                                        config.primary_color = value;
                                        window.elementSdk.setConfig({ primary_color: value });
                                    }
                                }
                            ],
                            borderables: [],
                            fontEditable: undefined,
                            fontSizeable: undefined
                        }),
                        mapToEditPanelValues: (config) => new Map([
                            ['society_name', config.society_name || defaultConfig.society_name],
                            ['admin_contact', config.admin_contact || defaultConfig.admin_contact],
                            ['welcome_message', config.welcome_message || defaultConfig.welcome_message]
                        ])
                    });
                } catch (error) {
                    console.error('Element SDK initialization error:', error);
                }
            }
        }

// Helper to convert File -> data URL (used for complaint photo attachments)
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

    // Setup event listeners
    function setupEventListeners() {
      // Auth forms
      // NOTE: login form uses Firebase handler defined later; avoid multiple bindings here.
      document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
      document.getElementById('contactForm')?.addEventListener('submit', handleContactForm);
      document.getElementById('complaintForm')?.addEventListener('submit', handleComplaintSubmit);

            // Navigation
            document.getElementById('mobileMenuBtn').addEventListener('click', toggleSidebar);
            document.getElementById('closeSidebarBtn').addEventListener('click', closeSidebar);
            document.getElementById('logoutBtn').addEventListener('click', handleLogout);

            // Setup navigation items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const page = this.dataset.page;
                    navigateToPage(page);
                    closeSidebar();
                });
            });
        }

        // Authentication functions
        function checkAuthStatus() {
            const savedUser = localStorage.getItem('societyUser');
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                isLoggedIn = true;
                showMainApp();
            } else {
                showAuthContainer();
            }
        }

    // Note: mock login handler removed to avoid duplicate handlers. The Firebase-backed
    // login handler defined later (after Firebase imports) will be used instead.

        async function handleRegister(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            
            if (password !== confirmPassword) {
                showToast('Passwords do not match', 'error');
                return;
            }
            
            // Mock registration
            const userData = {
                id: Date.now(),
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                unit: formData.get('unitNumber'),
                phone: formData.get('phoneNumber'),
                role: formData.get('userRole')
            };
            
            currentUser = {
                ...userData,
                name: `${userData.firstName} ${userData.lastName}`
            };
            
            localStorage.setItem('societyUser', JSON.stringify(currentUser));
            isLoggedIn = true;
            
            showToast('Registration successful!', 'success');
            showMainApp();
        } 
        
// Consolidated: login handler removed here to avoid duplicates. The single Firebase login
// handler is defined later (after Firebase imports) and will be used to authenticate users.




        function handleLogout() {
            localStorage.removeItem('societyUser');
            currentUser = null;
            isLoggedIn = false;
            showAuthContainer();
            showToast('Logged out successfully', 'info');
        }

        // UI state functions
        function showAuthContainer() {
            document.getElementById('authContainer').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
        }

        function showMainApp() {
            document.getElementById('authContainer').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            
            // Update user info
            document.getElementById('currentUserName').textContent = currentUser.name;
            document.getElementById('currentUserRole').textContent = currentUser.role === 'admin' ? 'Admin' : 'Resident';
            document.getElementById('userInitials').textContent = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
            
            // Show/hide navigation based on role
            if (currentUser.role === 'admin') {
                document.getElementById('residentNav').classList.add('hidden');
                document.getElementById('adminNav').classList.remove('hidden');
            } else {
                document.getElementById('residentNav').classList.remove('hidden');
                document.getElementById('adminNav').classList.add('hidden');
            }
            
            navigateToPage('dashboard');
        }

        function showLoginPage() {
            document.getElementById('loginPage').classList.remove('hidden');
            document.getElementById('registerPage').classList.add('hidden');
        }

        function showRegisterPage() {
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('registerPage').classList.remove('hidden');
        }

        // Navigation functions
        function navigateToPage(page) {
            // Hide all pages
            document.querySelectorAll('.page-content').forEach(pageEl => {
                pageEl.classList.add('hidden');
            });

            // Show selected page
            const targetPage = document.getElementById(page + 'Page');
            if (targetPage) {
                targetPage.classList.remove('hidden');
                currentPage = page;
                updateActiveNavigation(page);
        // If there are page-specific renderers, call them so dynamic content is fresh
        if (page === 'complaints' && typeof window.renderComplaints === 'function') {
          window.renderComplaints();
          // Also update complaint counters
          try { updateComplaintStats(); } catch (e) { /* ignore */ }
        }
        if (page === 'announcements' && typeof window.renderAnnouncementsPublic === 'function') {
          window.renderAnnouncementsPublic();
        }
        if (page === 'manage-announcements' && typeof window.renderManageAnnouncements === 'function') {
          window.renderManageAnnouncements();
        }
            }
        }

        function updateActiveNavigation(activePage) {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('bg-blue-50', 'text-blue-600', 'bg-purple-50', 'text-purple-600', 'bg-green-50', 'text-green-600');
                item.classList.add('text-gray-700');
            });

            const activeItem = document.querySelector(`[data-page="${activePage}"]`);
            if (activeItem) {
                if (activePage.includes('admin')) {
                    activeItem.classList.add('bg-purple-50', 'text-purple-600');
                } else if (activePage === 'contacts' || activePage === 'contact-us') {
                    activeItem.classList.add('bg-green-50', 'text-green-600');
                } else {
                    activeItem.classList.add('bg-blue-50', 'text-blue-600');
                }
                activeItem.classList.remove('text-gray-700');
            }
        }

        // Mobile menu functions
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('mainContent');
            
            sidebar.classList.toggle('open');
            mainContent.classList.toggle('sidebar-open');
        }

        function closeSidebar() {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('mainContent');
            
            sidebar.classList.remove('open');
            mainContent.classList.remove('sidebar-open');
        }
        // Global complaint list (includes manual + dynamic complaints)
const allComplaints = [
  {
    id: "C101",
    title: "Water leakage in bathroom",
    resident: "A-101",
    status: "In Progress",
    priority: "High",
  },
  {
    id: "C102",
    title: "Elevator not working",
    resident: "B-205",
    status: "New",
    priority: "Medium",
  },
  {
    id: "C103",
    title: "Streetlight near main gate not working",
    resident: "D-402",
    status: "New",
    priority: "Low",
  },
  {
    id: "C104",
    title: "Garbage collection delayed",
    resident: "E-108",
    status: "In Progress",
    priority: "Medium",
  },
];


        // Form handlers
        // async function handleContactForm(e) {
        //     e.preventDefault();
        //     const formData = new FormData(e.target);
            
        //     // Validate required fields
        //     const name = formData.get('name');
        //     const unit = formData.get('unit');
        //     const email = formData.get('email');
        //     const phone = formData.get('phone');
        //     const subject = formData.get('subject');
        //     const message = formData.get('message');
            
        //     if (!name || !unit || !email || !phone || !subject || !message) {
        //         showToast('Please fill in all required fields', 'error');
        //         return;
        //     }
            
        //     showToast('Message sent successfully! We will get back to you soon.', 'success');
        //     e.target.reset();
        // }

        // async function handleComplaintSubmit(e) {
        //     e.preventDefault();
        //     const formData = new FormData(e.target);
            
        //     // Validate required fields
        //     const category = formData.get('category');
        //     const priority = formData.get('priority');
        //     const title = formData.get('title');
        //     const description = formData.get('description');
            
        //     if (!category || !priority || !title || !description) {
        //         showToast('Please fill in all required fields', 'error');
        //         return;
        //     }
            
        //     // Create new complaint
        //     const newComplaint = {
        //         id: `C${String(Date.now()).slice(-3)}`,
        //         category: category,
        //         priority: priority,
        //         title: title,
        //         description: description,
        //         status: 'new',
        //         createdAt: new Date().toLocaleString(),
        //         resident: currentUser.name,
        //         unit: currentUser.unit
        //     };
            
        //     // Add to complaints list (simulate adding to existing complaints)
        //     addComplaintToList(newComplaint);
            
        //     showToast('Complaint submitted successfully! You can track it in "My Complaints".', 'success');
        //     resetComplaintForm();
            
        //     // Update dashboard stats
        //     updateDashboardStats();
            
        //     // Navigate to complaints page to show the new complaint
        //     setTimeout(() => {
        //         navigateToPage('complaints');
        //     }, 1500);
        // }

        // 🔹 Count and update total and pending complaints dynamically
function updateComplaintStats() {
  const complaints = JSON.parse(localStorage.getItem("complaints")) || [];

  const total = complaints.length;
  const pending = complaints.filter(c => c.status.toLowerCase() === "new" || c.status.toLowerCase() === "in-progress").length;

  const totalElement = document.getElementById("totalComplaints");
  const pendingElement = document.getElementById("pendingComplaints");

  if (totalElement) totalElement.textContent = total;
  if (pendingElement) pendingElement.textContent = pending;
}
function updateComplaintStatus(button, newStatus) {
  const row = button.closest("tr");
  const statusCell = row.querySelector("td:nth-child(4) span");

  // Update underlying data (localStorage) if present
  try {
    const stored = JSON.parse(localStorage.getItem('complaints')) || [];
    const idCell = row.querySelector('td:first-child');
    const compId = idCell ? idCell.textContent.trim() : null;
    if (compId) {
      const idx = stored.findIndex(c => String(c.id) === compId);
      if (idx !== -1) {
        stored[idx].status = newStatus;
        localStorage.setItem('complaints', JSON.stringify(stored));
      }
    }

    // Also update in-memory allComplaints array if it exists
    if (typeof allComplaints !== 'undefined' && Array.isArray(allComplaints)) {
      const aidx = allComplaints.findIndex(c => String(c.id) === compId);
      if (aidx !== -1) allComplaints[aidx].status = newStatus;
    }
  } catch (err) {
    console.warn('Could not persist complaint status change:', err);
  }

  // Update status visually
  if (statusCell) {
    statusCell.textContent = newStatus;
    statusCell.className = `px-2 py-1 rounded-full text-xs font-medium ${
      newStatus === 'Resolved'
        ? 'status-resolved'
        : newStatus === 'Closed'
        ? 'status-closed'
        : 'status-in-progress'
    }`;
  }

  // Re-render any lists that display complaints
  try { if (typeof window.renderComplaints === 'function') window.renderComplaints(); } catch(e){}
  try { if (typeof window.renderAdminComplaints === 'function') window.renderAdminComplaints(); } catch(e){}
  try { updateComplaintStats(); } catch(e){}

  // Optional: toast notification
  if (typeof showToast === "function") {
    showToast(`Complaint marked as ${newStatus}`, "success");
  } else {
    alert(`Complaint marked as ${newStatus}`);
  }
}

// Expose to global so inline onclick handlers in generated HTML can call it (module scope isn't global)
window.updateComplaintStatus = updateComplaintStatus;



        function resetComplaintForm() {
            document.getElementById('complaintForm').reset();
        }

        // Admin functions
        function showNewAnnouncementForm() {
            document.getElementById('newAnnouncementForm').classList.remove('hidden');
        }

        function hideNewAnnouncementForm() {
            document.getElementById('newAnnouncementForm').classList.add('hidden');
        }

        // Complaint management functions
        function addComplaintToList(complaint) {
            const complaintsPage = document.getElementById('complaintsPage');
            const complaintsContainer = complaintsPage.querySelector('.space-y-4');
            
            // Create complaint card
            const complaintCard = document.createElement('div');
            complaintCard.className = 'complaint-card';
            complaintCard.innerHTML = `
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h4 class="font-semibold text-gray-800">${complaint.title}</h4>
                            <span class="status-${complaint.status} px-2 py-1 rounded-full text-xs font-medium">${getStatusLabel(complaint.status)}</span>
                            <span class="priority-${complaint.priority} px-2 py-1 rounded-full text-xs font-medium">${getPriorityLabel(complaint.priority)}</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-3">${complaint.description}</p>
                        <div class="flex items-center space-x-4 text-xs text-gray-500">
                            <span>${getCategoryIcon(complaint.category)} ${getCategoryLabel(complaint.category)}</span>
                            <span>•</span>
                            <span>Created: ${complaint.createdAt}</span>
                            <span>•</span>
                            <span>ID: #${complaint.id}</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Add to the beginning of the list
            complaintsContainer.insertBefore(complaintCard, complaintsContainer.firstChild);
        }
        
        function getStatusLabel(status) {
            const labels = {
                'new': 'New',
                'in-progress': 'In Progress',
                'resolved': 'Resolved',
                'closed': 'Closed'
            };
            return labels[status] || status;
        }
        
        function getPriorityLabel(priority) {
            const labels = {
                'low': 'Low',
                'medium': 'Medium',
                'high': 'High',
                'urgent': 'Urgent'
            };
            return labels[priority] || priority;
        }
        
        function getCategoryLabel(category) {
            const labels = {
                'maintenance': 'Maintenance',
                'security': 'Security',
                'cleanliness': 'Cleanliness',
                'noise': 'Noise',
                'parking': 'Parking',
                'other': 'Other'
            };
            return labels[category] || category;
        }
        
        function getCategoryIcon(category) {
            const icons = {
                'maintenance': '🔧',
                'security': '🛡️',
                'cleanliness': '🧹',
                'noise': '🔊',
                'parking': '🚗',
                'other': '📝'
            };
            return icons[category] || '📝';
        }
        
        function updateDashboardStats() {
            // Get current complaint count and increment
            const totalElement = document.getElementById('totalComplaints');
            const pendingElement = document.getElementById('pendingComplaints');
            
            const currentTotal = parseInt(totalElement.textContent) || 0;
            const currentPending = parseInt(pendingElement.textContent) || 0;
            
            totalElement.textContent = currentTotal + 1;
            pendingElement.textContent = currentPending + 1;
        }

        // Utility functions
        function showToast(message, type = 'info') {
            const toastContainer = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            
            const colors = {
                success: 'bg-green-500',
                error: 'bg-red-500',
                warning: 'bg-yellow-500',
                info: 'bg-blue-500'
            };
            
            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };
            
            toast.className = `${colors[type]} text-white px-4 py-3 rounded-lg soft-shadow-lg flex items-center space-x-2 transform translate-x-full transition-transform duration-300`;
            toast.innerHTML = `
                <span class="font-bold">${icons[type]}</span>
                <span>${message}</span>
            `;
            
            toastContainer.appendChild(toast);
            
            // Animate in
            setTimeout(() => {
                toast.classList.remove('translate-x-full');
            }, 100);
            
            // Remove after 4 seconds
            setTimeout(() => {
                toast.classList.add('translate-x-full');
                setTimeout(() => {
                    if (toastContainer.contains(toast)) {
                        toastContainer.removeChild(toast);
                    }
                }, 300);
            }, 4000);
        }
        document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".nav-item");
  const pages = document.querySelectorAll(".page-content");

  // When user clicks a navigation link
  navItems.forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();

      // Get target page ID
      const page = item.getAttribute("data-page");
      const targetPage = document.getElementById(page + "Page");

      // Hide all pages
      pages.forEach(p => p.classList.add("hidden"));

      // Show the selected one (if it exists)
      if (targetPage) targetPage.classList.remove("hidden");

      // Update active link styling
      navItems.forEach(nav => nav.classList.remove("bg-blue-100", "text-blue-600"));
      item.classList.add("bg-blue-100", "text-blue-600");
    });
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const complaintForm = document.getElementById("complaintForm");
  const complaintsContainer = document.querySelector("#complaintsPage .space-y-4");

  // 🔹 Load saved complaints from localStorage
  let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

  // Seed complaints from dashboard's recent list if none exist yet
  if (!complaints || complaints.length === 0) {
    const now = Date.now();
    const seedComplaints = [
      {
        id: 'C' + (now - 1000),
        title: 'Water leakage in bathroom',
        description: 'There is continuous water leakage from the bathroom ceiling. It started yesterday and is getting worse.',
        category: 'maintenance',
        priority: 'high',
        status: 'New',
        created: new Date(now - 2 * 60 * 60 * 1000).toLocaleString()
      },
      {
        id: 'C' + (now - 2000),
        title: 'Elevator not working',
        description: 'The elevator is not functioning properly since morning.',
        category: 'maintenance',
        priority: 'medium',
        status: 'In Progress',
        created: new Date(now - 24 * 60 * 60 * 1000).toLocaleString()
      },
      {
        id: 'C' + (now - 3000),
        title: 'Parking space issue',
        description: "My designated parking space A-101 is being occupied by someone else's vehicle for the past 3 days.",
        category: 'parking',
        priority: 'medium',
        status: 'In Progress',
        created: new Date(now - 2 * 24 * 60 * 60 * 1000).toLocaleString()
      },
      {
        id: 'C' + (now - 4000),
        title: 'Lift Issue',
        description: 'Lift Issue reported by residents.',
        category: 'maintenance',
        priority: 'high',
        status: 'New',
        created: new Date(now - 1 * 24 * 60 * 60 * 1000).toLocaleString()
      },
      {
        id: 'C' + (now - 5000),
        title: 'Garden Bench is Broken',
        description: 'A bench in the garden is broken and needs repair.',
        category: 'maintenance',
        priority: 'low',
        status: 'In Progress',
        created: new Date(now - 9 * 24 * 60 * 60 * 1000).toLocaleString()
      },
      {
        id: 'C' + (now - 6000),
        title: 'Bachelor are making late night noise',
        description: 'Loud noise late at night from occupants in Unit B-402.',
        category: 'noise',
        priority: 'medium',
        status: 'New',
        created: new Date(now - 3 * 24 * 60 * 60 * 1000).toLocaleString()
      },
      {
        id: 'C' + (now - 7000),
        title: 'Streetlight near main gate not working',
        description: 'Streetlight near main gate not working',
        category: 'maintenance',
        priority: 'low',
        status: 'Resolved',
        created: new Date(now - 1 * 24 * 60 * 60 * 1000).toLocaleString()
      },
      {
        id: 'C' + (now - 8000),
        title: 'Garbage collection delayed',
        description: 'Garbage collection delayed across the society.',
        category: 'maintenance',
        priority: 'medium',
        status: 'In Progress',
        created: new Date(now - 3 * 24 * 60 * 60 * 1000).toLocaleString()
      }
    ];
    complaints = seedComplaints;
    localStorage.setItem('complaints', JSON.stringify(complaints));
  }

  // 🔹 Render any existing complaints on load
  renderComplaints();
  updateComplaintStats();


  if (complaintForm) {
    complaintForm.addEventListener("submit", async e => {
      e.preventDefault(); // Prevent page reload

      // Read photo file if provided
      const photoInput = document.getElementById("complaintPhotoInput");
      let imageData = null;
      if (photoInput && photoInput.files && photoInput.files[0]) {
        const file = photoInput.files[0];
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
          alert('Photo is too large. Please select an image smaller than 2MB.');
          return;
        }
        try {
          imageData = await fileToDataUrl(file);
        } catch (err) {
          console.error('Failed to read image file', err);
          alert('Failed to read attached photo. Please try another file.');
          return;
        }
      }

      // Collect form data
      const complaint = {
        id: "C" + String(Date.now()).slice(-5), // unique ID
        title: document.getElementById("complaintTitle").value,
        description: document.getElementById("complaintDescription").value,
        category: document.getElementById("complaintCategory").value,
        priority: document.getElementById("complaintPriority").value,
        status: "New",
        created: new Date().toLocaleString(),
        image: imageData // may be null
      };

      // Add to array
      complaints.push(complaint);

      // 🔹 Save updated array to localStorage
      localStorage.setItem("complaints", JSON.stringify(complaints));

      // Update "My Complaints" page
      renderComplaints();

      // Show confirmation
      alert("✅ Complaint submitted successfully!");

      // Reset form
      complaintForm.reset();

      // Navigate to "My Complaints" page
      navigateToPage("complaints");
    });
  }

  // 🔹 Function to display complaints dynamically
  function renderComplaints() {
  if (!complaintsContainer) return;
  complaintsContainer.innerHTML = "";

    if (complaints.length === 0) {
    complaintsContainer.innerHTML = `<p class="text-gray-500 text-sm">No complaints submitted yet.</p>`;
  } else {
    complaints.forEach(c => {
      const card = document.createElement("div");
      card.className = "complaint-card";
      card.innerHTML = `
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h4 class="font-semibold text-gray-800">${c.title}</h4>
              <span class="status-${c.status.toLowerCase()} px-2 py-1 rounded-full text-xs font-medium">${c.status}</span>
              <span class="priority-${c.priority.toLowerCase()} px-2 py-1 rounded-full text-xs font-medium">${c.priority}</span>
            </div>
            ${c.image ? `<div class="mb-3"><img src="${c.image}" alt="complaint-photo" class="w-full max-w-xs rounded-lg object-cover"></div>` : ''}
            <p class="text-sm text-gray-600 mb-3">${c.description}</p>
            <div class="flex items-center space-x-4 text-xs text-gray-500">
              <span>📅 ${c.created}</span>
              <span>•</span>
              <span>ID: #${c.id}</span>
            </div>
          </div>
        </div>
      `;
      complaintsContainer.appendChild(card);
    });
  }

  // ✅ Update dashboard counters
 
}

// Utility to clear application localStorage (preserves other browser storage).
// Call via clearAppLocalStorage() or using the UI button added to footer.
window.clearAppLocalStorage = function(clearAll = false) {
  try {
    const confirmed = confirm('Clear app storage? This will remove saved complaints, announcements and your login. Continue?');
    if (!confirmed) return;
    if (clearAll) {
      localStorage.clear();
    } else {
      localStorage.removeItem('complaints');
      localStorage.removeItem('announcements');
      localStorage.removeItem('societyUser');
      // keep any unrelated keys untouched
    }
    // Inform user and reload so UI reflects cleared state
    if (typeof showToast === 'function') showToast('Local storage cleared', 'info');
    setTimeout(() => location.reload(), 700);
  } catch (err) {
    console.error('Failed to clear local storage', err);
    alert('Failed to clear local storage: ' + err.message);
  }
};

  // Expose renderer so navigation or other code can re-render on demand
  window.renderComplaints = renderComplaints;


  const API_BASE = "https://j0hu9iy4ph.execute-api.ap-south-1.amazonaws.com/prod";

// Function to submit a new complaint
async function submitComplaint(event) {
  event.preventDefault();

  const data = {
    userEmail: document.getElementById("contactEmail").value,
    title: document.getElementById("complaintTitle").value,
    description: document.getElementById("complaintDescription").value,
    category: document.getElementById("complaintCategory").value,
    priority: document.getElementById("complaintPriority").value
  };

  const response = await fetch(`${API_BASE}/complaints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  alert(result.message || "Complaint submitted!");
}

  // 🔹 Navigation helper
  window.navigateToPage = function(pageName) {
    document.querySelectorAll(".page-content").forEach(p => p.classList.add("hidden"));
    const targetPage = document.getElementById(pageName + "Page");
    if (targetPage) targetPage.classList.remove("hidden");
  };
});
   
//  (function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'99588a90f6a3162a',t:'MTc2MTYzNDY3MC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();
 
  
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
  import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged , sendPasswordResetEmail } 
    from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCIPcM5mj632YlL8L1amEn5IeGIM6bE0cg",
    authDomain: "bharati-eec34.firebaseapp.com",
    projectId: "bharati-eec34",
    storageBucket: "bharati-eec34.firebasestorage.app",
    messagingSenderId: "447099319243",
    appId: "1:447099319243:web:bdd4ac26baad64daac3c4e",
    measurementId: "G-Y5GX804JV1"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Fixed admin credentials (local fallback)
  const ADMIN_EMAIL = 'admin@bharati.local';
  const ADMIN_PASSWORD = 'AdminPass123';

  // 🔹 Handle Register Form
  const registerForm = document.getElementById('registerForm');
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Account created successfully!");
      showLoginPage();
    } catch (error) {
      alert(error.message);
    }
  });

   const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
  forgotPasswordBtn.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
if (!email) {
      alert("Please enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("✅ Password reset email sent successfully! Check your inbox.");
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        alert("No user found with that email address.");
      } else if (error.code === 'auth/invalid-email') {
        alert("Please enter a valid email address.");
      } else {
        alert("Error: " + error.message);
      }
    }
  });

  // 🔹 Handle Login Form
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // If credentials match fixed admin, sign in locally as admin (no Firebase required)
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      currentUser = {
        id: 'admin',
        name: 'Admin User',
        role: 'admin',
        email: ADMIN_EMAIL
      };
      localStorage.setItem('societyUser', JSON.stringify(currentUser));
      isLoggedIn = true;
      showToast('Admin login successful', 'success');
      showMainApp();
      return;
    }

    // Otherwise fallback to Firebase authentication
    try {
      await signInWithEmailAndPassword(auth, email, password);
      document.getElementById('authContainer').classList.add('hidden');
      document.getElementById('mainApp').classList.remove('hidden');
    } catch (error) {
      alert(error.message);
    }
  });

  // 🔹 Handle Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('authContainer').classList.remove('hidden');
  });
  

  // 🔹 Track Auth State
  onAuthStateChanged(auth, (user) => {
    if (user) {
      document.getElementById('currentUserName').textContent = user.email.split('@')[0];
      document.getElementById('currentUserRole').textContent = 'Resident';
    }
  });

  // 🔹 Show/Hide pages
  window.showRegisterPage = () => {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('registerPage').classList.remove('hidden');
  };

  window.showLoginPage = () => {
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
  };
  
  // Announcements storage + functions
  const announcementsKey = 'announcements';

  function loadAnnouncements() {
    return JSON.parse(localStorage.getItem(announcementsKey)) || [];
  }

  function saveAnnouncements(list) {
    localStorage.setItem(announcementsKey, JSON.stringify(list));
  }

  function renderAnnouncementsPublic() {
    const container = document.getElementById('announcementsList');
    if (!container) return;
    const list = loadAnnouncements();
    container.innerHTML = '';
    if (list.length === 0) {
      container.innerHTML = '<p class="text-gray-500">No announcements yet.</p>';
      return;
    }
    list.forEach(a => {
      const el = document.createElement('div');
      el.className = 'announcement-card';
      el.innerHTML = `
        <div class="flex items-start justify-between mb-3">
         <div class="flex-1">
          <div class="flex items-center space-x-2 mb-2"><span class="bg-${a.priority === 'urgent' ? 'red' : a.priority === 'info' ? 'green' : 'blue'}-100 text-${a.priority === 'urgent' ? 'red' : a.priority === 'info' ? 'green' : 'blue'}-800 px-2 py-1 rounded-full text-xs font-medium">${a.priority}</span> <span class="text-xs text-gray-500">Posted ${a.createdAgo || 'just now'}</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">${a.title}</h3>
          <p class="text-gray-600">${a.description}</p>
         </div>
        </div>
      `;
      container.appendChild(el);
    });
  }

  function renderManageAnnouncements() {
    const container = document.getElementById('manageAnnouncementsList');
    if (!container) return;
    const list = loadAnnouncements();
    container.innerHTML = '';
    if (list.length === 0) {
      container.innerHTML = '<p class="text-gray-500">No announcements yet.</p>';
      return;
    }
    list.slice().reverse().forEach(a => {
      const el = document.createElement('div');
      el.className = 'bg-white rounded-xl soft-shadow p-6 flex items-start justify-between';
      el.innerHTML = `
        <div class="flex-1">
          <div class="flex items-center space-x-2 mb-2">
            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">${a.priority}</span>
            <span class="text-xs text-gray-500">${a.created}</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">${a.title}</h3>
          <p class="text-gray-600">${a.description}</p>
        </div>
        <div class="flex flex-col space-y-2 ml-4">
          <button class="btn-secondary text-sm" data-id="${a.id}" onclick="editAnnouncement('${a.id}')">Edit</button>
          <button class="btn-secondary text-sm text-red-600" data-id="${a.id}" onclick="deleteAnnouncement('${a.id}')">Delete</button>
        </div>
      `;
      container.appendChild(el);
    });
  }

  // Expose delete/edit functions to window for inline onclick usage
  window.deleteAnnouncement = function(id) {
    let list = loadAnnouncements();
    list = list.filter(a => a.id !== id);
    saveAnnouncements(list);
    renderManageAnnouncements();
    renderAnnouncementsPublic();
    showToast('Announcement deleted', 'info');
  };

  window.editAnnouncement = function(id) {
    const list = loadAnnouncements();
    const a = list.find(x => x.id === id);
    if (!a) return;
    // populate form and show editor
    document.getElementById('newAnnouncementTitle').value = a.title;
    document.getElementById('newAnnouncementPriority').value = a.priority;
    document.getElementById('newAnnouncementDescription').value = a.description;
    showNewAnnouncementForm();
    // When form submitted, replace the announcement instead of adding new. We'll store id in dataset.
    document.getElementById('newAnnouncementFormForm').dataset.editId = id;
  };

  // Handle new announcement form submission
  const newAnnouncementForm = document.getElementById('newAnnouncementFormForm');
  if (newAnnouncementForm) {
    newAnnouncementForm.addEventListener('submit', e => {
      e.preventDefault();
      const title = document.getElementById('newAnnouncementTitle').value.trim();
      const priority = document.getElementById('newAnnouncementPriority').value;
      const description = document.getElementById('newAnnouncementDescription').value.trim();
      if (!title || !description) {
        showToast('Please fill title and description', 'error');
        return;
      }
      const list = loadAnnouncements();
      const now = new Date();
      const payload = {
        id: 'A' + Date.now(),
        title,
        priority,
        description,
        created: now.toLocaleString(),
        createdAgo: 'just now'
      };

      const editId = newAnnouncementForm.dataset.editId;
      if (editId) {
        // replace
        const idx = list.findIndex(x => x.id === editId);
        if (idx !== -1) {
          payload.id = editId; // keep id
          list[idx] = payload;
        } else {
          list.push(payload);
        }
        delete newAnnouncementForm.dataset.editId;
      } else {
        list.push(payload);
      }

      saveAnnouncements(list);
      renderManageAnnouncements();
      renderAnnouncementsPublic();
      newAnnouncementForm.reset();
      hideNewAnnouncementForm();
      showToast('Announcement saved', 'success');
    });
  }

  // Initial render of announcements on load
  // Seed announcements from dashboard's recent list if none exist yet
  (function seedAnnouncementsIfEmpty() {
    const existing = loadAnnouncements();
    if (existing && existing.length > 0) return;

    const seed = [
      {
        id: 'A' + (Date.now() - 60000),
        title: 'Water Supply Maintenance',
        priority: 'urgent',
        description: 'Water supply will be interrupted tomorrow from 10 AM to 2 PM for maintenance work. Please store water accordingly.',
        created: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(),
        createdAgo: '2 hours ago'
      },
      {
        id: 'A' + (Date.now() - 120000),
        title: 'Monthly Society Meeting',
        priority: 'general',
        description: 'Monthly society meeting is scheduled for this Sunday at 6 PM in the clubhouse. All residents are requested to attend.',
        created: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(),
        createdAgo: '1 day ago'
      },
      {
        id: 'A' + (Date.now() - 180000),
        title: 'New Security Guard',
        priority: 'info',
        description: 'We have appointed a new security guard for the night shift. Mr. Rajesh Kumar will be joining from Monday.',
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString(),
        createdAgo: '2 days ago'
      }
    ];
    saveAnnouncements(seed);
  })();

  renderManageAnnouncements();
  renderAnnouncementsPublic();
// --- Firebase Imports ---






async function submitComplaint(event) {
  event.preventDefault();

  const complaintData = {
    category: document.getElementById("complaintCategory").value,
    priority: document.getElementById("complaintPriority").value,
    title: document.getElementById("complaintTitle").value,
    description: document.getElementById("complaintDescription").value,
    createdAt: new Date().toISOString(),
  };

  try {
    const response = await fetch(`${API_BASE}/saveComplaint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(complaintData),
    });

    const result = await response.json();
    alert(result.message || "Complaint submitted successfully!");

    document.getElementById("complaintForm").reset();
  } catch (error) {
    console.error("Error submitting complaint:", error);
    alert("Failed to submit complaint. Please try again.");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("adminComplaintsTable");
  if (!tableBody) return;
  // Render admin complaints from localStorage if available, otherwise fallback to allComplaints
  function renderAdminComplaints() {
    const tb = document.getElementById('adminComplaintsTable');
    if (!tb) return;
    tb.innerHTML = '';

    const stored = JSON.parse(localStorage.getItem('complaints')) || [];
    const source = stored && stored.length ? stored : (Array.isArray(allComplaints) ? allComplaints : []);

    source.forEach(c => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-6 py-4 font-medium text-gray-900">${c.id}</td>
        <td class="px-6 py-4">${c.title}</td>
        <td class="px-6 py-4">${c.resident || c.unit || 'N/A'}</td>
        <td class="px-6 py-4">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${
            (c.status || '').toLowerCase() === 'resolved'
              ? 'status-resolved'
              : (c.status || '').toLowerCase() === 'closed'
              ? 'status-closed'
              : (c.status || '').toLowerCase() === 'in progress' || (c.status || '').toLowerCase() === 'in-progress'
              ? 'status-in-progress'
              : 'status-new'
          }">${c.status || 'New'}</span>
        </td>
        <td class="px-6 py-4">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${
            (c.priority || '').toLowerCase() === 'high'
              ? 'priority-high'
              : (c.priority || '').toLowerCase() === 'medium'
              ? 'priority-medium'
              : (c.priority || '').toLowerCase() === 'low'
              ? 'priority-low'
              : 'priority-urgent'
          }">${c.priority || ''}</span>
        </td>
        <td class="px-6 py-4 space-x-2">
          <button class="btn-primary text-xs px-3 py-1" onclick="updateComplaintStatus(this, 'Resolved')">Resolve</button>
          <button class="btn-secondary text-xs px-3 py-1" onclick="updateComplaintStatus(this, 'Closed')">Close</button>
        </td>
      `;
      tb.appendChild(row);
    });
  }

  // expose renderer
  window.renderAdminComplaints = renderAdminComplaints;

  // initial render
  renderAdminComplaints();
});
