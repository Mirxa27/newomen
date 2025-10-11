// In useAdmin.tsx, line 43
const isAdminByRole = (data?.role ?? 'user') === 'admin'; // Fixed: Use ?? for null safety
setIsAdmin(isAdminByRole || isAdminByEmail);