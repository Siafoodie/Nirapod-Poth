
const USER_STORAGE_KEY = "user";

export const sanitizeUser = (user) => {
  if (!user || typeof user !== "object" || Array.isArray(user)) {
    return null;
  }

  const safeUser = {};

  if (user._id != null) {
    safeUser._id = String(user._id);
  }

  if (user.id != null) {
    safeUser.id = String(user.id);
  }

  if (typeof user.name === "string") {
    safeUser.name = user.name;
  }

  if (typeof user.email === "string") {
    safeUser.email = user.email;
  }

  if (typeof user.phone === "string") {
    safeUser.phone = user.phone;
  }

  if (typeof user.profileImage === "string") {
    safeUser.profileImage = user.profileImage;
  }

  return safeUser;
};

export const saveUser = (user) => {
  const safeUser = sanitizeUser(user);

  if (!safeUser) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }

  localStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify(safeUser)
  );
};

export const getStoredUser = () => {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);

    if (!stored) return null;

    return sanitizeUser(JSON.parse(stored));
  } catch {
    return null;
  }
};

export const clearStoredUser = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
};
