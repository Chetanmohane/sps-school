const role = (authorizedRoles) => { 
  return (req, res, next) => {
    const roles = Array.isArray(authorizedRoles) ? authorizedRoles : [authorizedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access Denied: ${req.user.role} role is not authorized.` 
      });
    }
    next();
  };
};

module.exports = role;