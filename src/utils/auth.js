const AUTH_STORAGE_KEY = "staffSession";

export const saveSession = (session) => {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(session)
  );
};

export const getSession = () => {
  const session = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!session) {
    return null;
  }

  try {
    return JSON.parse(session);
  } catch (error) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem("staffToken");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
};

export const isAuthenticated = () => {
  const session = getSession();

  return Boolean(session?.accessToken);
};