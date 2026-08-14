const role = (authorizedRoles) => { 
  return (req, res, next) => {
    const roles = (Array.isArray(authorizedRoles) ? authorizedRoles : [authorizedRoles]).map(r => String(r).toLowerCase().trim().replace(/[\s_]+/g, '-'));
    const rawUserRole = String(req.user?.role || '').toLowerCase().trim();
    const userRole = rawUserRole.replace(/[\s_]+/g, '-');

    // Super Admin and Manager Admin have full executive administrative access across all desks
    const isTopAdmin = [
      'super-admin', 'superadmin',
      'manager-admin', 'manageradmin', 'manager'
    ].includes(userRole);

    if (!roles.includes(userRole) && !isTopAdmin) {
      return res.status(403).json({ 
        message: `Access Denied: ${req.user?.role || 'User'} role is not authorized.` 
      });
    }
    next();
  };
};

module.exports = role;