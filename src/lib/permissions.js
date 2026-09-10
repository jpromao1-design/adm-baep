export const ROLES = {
  admin: {
    label: 'Administrador',
    permissions: {
      manageUsers: true,
      manageAccessRequests: true,
      manageTasks: true,
      changeAnyStatus: true,
      viewAllTasks: true,
      importExport: true,
    },
  },
  auxiliar: {
    label: 'Auxiliar',
    permissions: {
      manageUsers: false,
      manageAccessRequests: false,
      manageTasks: true,
      changeAnyStatus: true,
      viewAllTasks: true,
      importExport: true,
    },
  },
};

export function getRoleLabel(role) {
  return ROLES[role]?.label || role || '—';
}

export function can(profile, permission) {
  if (!profile || profile.active === false) return false;
  const role = profile.role || 'auxiliar';
  return Boolean(ROLES[role]?.permissions?.[permission]);
}

export function isAdmin(profile) {
  return can(profile, 'manageUsers');
}
