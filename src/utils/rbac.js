export const STAFF_ROLES = Object.freeze(['admin', 'editor', 'moderator']);

export const ROLE_PERMISSIONS = Object.freeze({
  admin: ['*'],
  editor: [
    'dashboard',
    'create-post',
    'media-management',
    'content-management',
    'polls',
    'realtime-content'
  ],
  moderator: [
    'dashboard',
    'comment-moderation',
    'post-reports'
  ]
});

export const isStaffRole = role => STAFF_ROLES.includes(role);

export const canAccessAdminSection = (role, section) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(section);
};

export const getRoleSummary = role => {
  if (role === 'admin') return 'Full access to users, settings, content, brands, events, and system controls.';
  if (role === 'editor') return 'Can create and manage approved posts, media, polls, and breaking news. Event access is restricted to Admins.';
  if (role === 'moderator') return 'Can review comments and content reports, without publishing or system access.';
  return 'Standard platform access only.';
};
