import api from './api';

// ─── Auth ──────────────────────────────────────────────
// POST /api/auth/register  → { name, email, password, role }
// POST /api/auth/login     → { email, password }
// GET  /api/auth/me
// POST /api/auth/forgot-password
// POST /api/auth/reset-password/:token
export const authService = {
  register:          (data)           => api.post('/auth/register', data),
  login:             (data)           => api.post('/auth/login', data),
  logout:            ()               => api.post('/auth/logout'),
  getMe:             ()               => api.get('/auth/me'),
  forgotPassword:    (email)          => api.post('/auth/forgot-password', { email }),
  resetPassword:     (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// ─── Student ───────────────────────────────────────────
// GET  /api/student/profile
// PUT  /api/student/profile  → { bio, college, skills, github, linkedin }
// PUT  /api/student/avatar   (multipart)
// PUT  /api/student/resume   (multipart)
export const studentService = {
  getProfile:    ()         => api.get('/student/profile'),
  updateProfile: (data)     => api.put('/student/profile', data),
  uploadAvatar:  (formData) => api.put('/student/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadResume:  (formData) => api.put('/student/resume',  formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  getDashboard:   ()            => api.get('/student/dashboard'),
  getBookmarks:   ()            => api.get('/student/bookmarks'),
  toggleBookmark: (hackathonId) => api.post(`/student/bookmarks/${hackathonId}`),
  getCertificates:()            => api.get('/student/certificates'),
};

// ─── Hackathons ────────────────────────────────────────
// GET  /api/hackathons          ?status=&mode=&theme=&search=&page=&limit=
// GET  /api/hackathons/:id
// GET  /api/hackathons/:id/leaderboard
// Organizer CRUD lives on the same /hackathons base (role-gated server-side).
export const hackathonService = {
  getAll:         (params) => api.get('/hackathons', { params }),
  getById:        (id)     => api.get(`/hackathons/${id}`),
  getLeaderboard: (id)     => api.get(`/hackathons/${id}/leaderboard`),

  // organizer
  getMine:        ()           => api.get('/hackathons/my'),
  create:         (data)       => api.post('/hackathons', data),
  update:         (id, data)   => api.put(`/hackathons/${id}`, data),
  remove:         (id)         => api.delete(`/hackathons/${id}`),
  updateStatus:   (id, status) => api.put(`/hackathons/${id}/status`, { status }),
  uploadBanner:   (id, formData) =>
    api.put(`/hackathons/${id}/banner`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ─── Registrations (student) ───────────────────────────
export const registrationService = {
  register:        (hackathonId, note) => api.post(`/registrations/${hackathonId}`, { note }),
  unregister:      (hackathonId)       => api.delete(`/registrations/${hackathonId}`),
  getMyStatus:     (hackathonId)       => api.get(`/registrations/${hackathonId}/my`),
  getMine:         ()                  => api.get('/registrations/my'),
};

// ─── Home / Reviews (public) ───────────────────────────
export const homeService = {
  getHomeData: ()     => api.get('/home'),
  getReviews:  ()     => api.get('/home/reviews'),
  addReview:   (data) => api.post('/home/reviews', data),
};

// ─── Notifications ─────────────────────────────────────
export const notificationService = {
  getAll:    (params) => api.get('/notifications', { params }),
  markRead:  (id)     => api.put(`/notifications/${id}/read`),
  markAllRead: ()     => api.put('/notifications/read-all'),
  remove:    (id)     => api.delete(`/notifications/${id}`),
};

// ─── Admin ─────────────────────────────────────────────
// All routes under /api/admin, role-gated to admin server-side.
export const adminService = {
  // analytics
  getDashboard: ()       => api.get('/admin/dashboard'),
  getStats:     ()       => api.get('/admin/stats'),

  // user management
  getUsers:     (params) => api.get('/admin/users', { params }),
  getUser:      (id)     => api.get(`/admin/users/${id}`),
  suspendUser:  (id, reason) => api.put(`/admin/users/${id}/ban`, { reason }),
  reinstateUser:(id)     => api.put(`/admin/users/${id}/unban`),
  deleteUser:   (id)     => api.delete(`/admin/users/${id}`),

  // verification (organizer approvals)
  getPendingOrganizers: (type) => api.get('/admin/approvals/organizers', { params: type ? { type } : {} }),
  reviewOrganizer:      (id, type, action) =>
    api.put(`/admin/approvals/organizers/${id}`, { type, action }),

  // hackathon management
  getHackathons:    (params)      => api.get('/admin/hackathons', { params }),
  reviewHackathon:  (id, action, reason) => api.put(`/admin/hackathons/${id}/approve`, { action, reason }),
  featureHackathon: (id, featured) => api.put(`/admin/hackathons/${id}/feature`, { featured }),
  deleteHackathon:  (id)          => api.delete(`/admin/hackathons/${id}`),

  // email / broadcast
  broadcast:      (data) => api.post('/admin/broadcast', data),
  getBroadcasts:  ()     => api.get('/admin/broadcasts'),
};

// ─── Organizer (college + company) ─────────────────────
// All routes under /api/organizer, role-gated to college|company server-side.
const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const organizerService = {
  // profile
  getProfile:    ()         => api.get('/organizer/profile'),
  updateProfile: (data)     => api.put('/organizer/profile', data),
  uploadLogo:    (formData) => api.put('/organizer/logo',  formData, multipart),
  uploadCover:   (formData) => api.put('/organizer/cover', formData, multipart),

  // dashboard
  getOverview:   ()           => api.get('/organizer/overview'),
  getAnalytics:  (hid)        => api.get(`/organizer/${hid}/analytics`),

  // problem statements
  addProblem:    (hid, data)        => api.post(`/organizer/${hid}/problem-statements`, data),
  updateProblem: (hid, psId, data)  => api.put(`/organizer/${hid}/problem-statements/${psId}`, data),
  deleteProblem: (hid, psId)        => api.delete(`/organizer/${hid}/problem-statements/${psId}`),
  // resources scoped to a problem statement
  addProblemResource:    (hid, psId, data)   => api.post(`/organizer/${hid}/problem-statements/${psId}/resources`, data),
  deleteProblemResource: (hid, psId, resId)  => api.delete(`/organizer/${hid}/problem-statements/${psId}/resources/${resId}`),

  // resources
  addResource:    (hid, data)   => api.post(`/organizer/${hid}/resources`, data),
  deleteResource: (hid, resId)  => api.delete(`/organizer/${hid}/resources/${resId}`),

  // participants
  getParticipants:    (hid, params) => api.get(`/organizer/${hid}/participants`, { params }),
  setParticipantStatus: (hid, regId, status) =>
    api.put(`/organizer/${hid}/participants/${regId}/status`, { status }),
  exportParticipants: (hid) =>
    api.get(`/organizer/${hid}/participants/export`, { responseType: 'blob' }),
  exportParticipantsExcel: (hid) =>
    api.get(`/organizer/${hid}/participants/export/excel`, { responseType: 'blob' }),

  // teams + submissions
  shortlistTeam:    (hid, teamId, shortlisted) =>
    api.put(`/organizer/${hid}/teams/${teamId}/shortlist`, { shortlisted }),
  reviewSubmission: (hid, subId, data) =>
    api.put(`/organizer/${hid}/submissions/${subId}/review`, data),
  exportSubmissions: (hid) =>
    api.get(`/organizer/${hid}/submissions/export`, { responseType: 'blob' }),
  remindSubmissions: (hid, message) =>
    api.post(`/organizer/${hid}/submissions/remind`, { message }),

  // leaderboard / winners
  getLeaderboard: (hid)          => api.get(`/organizer/${hid}/leaderboard`),
  publishWinners: (hid, winners) => api.put(`/organizer/${hid}/winners`, { winners }),

  // announcements
  getAnnouncements:    (hid)        => api.get(`/organizer/${hid}/announcements`),
  createAnnouncement:  (hid, data)  => api.post(`/organizer/${hid}/announcements`, data),
  deleteAnnouncement:  (hid, annId) => api.delete(`/organizer/${hid}/announcements/${annId}`),

  // email / contact
  emailParticipants: (hid, data) => api.post(`/organizer/${hid}/email`, data),

  // certificates
  generateCertificates: (hid) => api.post(`/organizer/${hid}/certificates/generate`),
  getCertificates:      (hid) => api.get(`/organizer/${hid}/certificates`),
};

// Existing organizer endpoints living on other route bases
export const orgDataService = {
  getTeams:       (hid) => api.get(`/teams/${hid}/all`),
  getSubmissions: (hid) => api.get(`/submissions/${hid}/all`),
};

// ─── Teams ────────────────────────────────────────────
// All routes scoped under /api/teams/:hackathonId/
// POST   /:hackathonId/create   → { name }
// POST   /:hackathonId/join     → { inviteCode }
// GET    /:hackathonId/my
// PUT    /:hackathonId/complete
// PUT    /:hackathonId/regenerate-code
// DELETE /:hackathonId/leave
// DELETE /:hackathonId/delete
export const teamService = {
  create:           (hackathonId, name)       => api.post(`/teams/${hackathonId}/create`, { name }),
  join:             (hackathonId, inviteCode) => api.post(`/teams/${hackathonId}/join`, { inviteCode }),
  getMyTeam:        (hackathonId)             => api.get(`/teams/${hackathonId}/my`),
  markComplete:     (hackathonId)             => api.put(`/teams/${hackathonId}/complete`),
  regenerateCode:   (hackathonId)             => api.put(`/teams/${hackathonId}/regenerate-code`),
  leaveTeam:        (hackathonId)             => api.delete(`/teams/${hackathonId}/leave`),
  deleteTeam:       (hackathonId)             => api.delete(`/teams/${hackathonId}/delete`),
};

// ─── Submissions ───────────────────────────────────────
// POST /api/submissions/:hackathonId/submit  (multipart — presentation file optional)
// PUT  /api/submissions/:hackathonId/edit    (multipart)
// GET  /api/submissions/:hackathonId/my
export const submissionService = {
  submit:         (hackathonId, formData) =>
    api.post(`/submissions/${hackathonId}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  edit:           (hackathonId, formData) =>
    api.put(`/submissions/${hackathonId}/edit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMySubmission: (hackathonId) => api.get(`/submissions/${hackathonId}/my`),
};
