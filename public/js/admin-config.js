const API_CONFIG = {
  BASE_URL: '/api',
  TOKEN_KEY: 'accdee_token',
  USER_KEY:  'accdee_user',
  endpoints: {
    login:         '/auth/login',
    verifyOtp:     '/auth/verify-otp',
    stats:         '/admin/stats',
    topups:        '/admin/topups',
    topupHistory:  '/admin/topups/history',
    members:       '/admin/members'
  },
  getToken()        { return localStorage.getItem(this.TOKEN_KEY); },
  setToken(token)   { localStorage.setItem(this.TOKEN_KEY, token); },
  getUser()         { return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null'); },
  setUser(user)     { localStorage.setItem(this.USER_KEY, JSON.stringify(user)); },
  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
};
