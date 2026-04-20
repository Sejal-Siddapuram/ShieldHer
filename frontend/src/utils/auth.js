export const getToken = () => localStorage.getItem('shieldher_token');

export const getPseudonym = () => localStorage.getItem('shieldher_pseudonym');

export const isLoggedIn = () => !!localStorage.getItem('shieldher_token');

export const logout = () => {
  localStorage.removeItem('shieldher_token');
  localStorage.removeItem('shieldher_pseudonym');
  window.location.href = '/login';
};
