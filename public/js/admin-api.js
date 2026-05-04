const API = {
  async _request(method, endpoint, body, opts = {}) {
    const url = API_CONFIG.BASE_URL + endpoint;
    const headers = { 'Content-Type': 'application/json' };

    if (!opts.skipAuth) {
      const token = API_CONFIG.getToken();
      if (token) headers['Authorization'] = 'Bearer ' + token;
    }

    const config = { method, headers };
    if (body !== null && body !== undefined) config.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(url, config);
    } catch (e) {
      const err = new Error('ไม่สามารถเชื่อมต่อ Server ได้');
      err.code = 'NETWORK';
      throw err;
    }

    if (res.status === 401 && !opts.skipAuth) {
      API_CONFIG.clearToken();
      location.replace('/admin-login.html?expired=1');
      throw new Error('Unauthorized');
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Server ส่งข้อมูลผิดรูปแบบ');
    }

    if (!res.ok) {
      const err = new Error(data.message || 'Server error');
      err.status = res.status;
      throw err;
    }

    return data;
  },

  get(endpoint, opts)        { return this._request('GET',    endpoint, null, opts); },
  post(endpoint, body, opts) { return this._request('POST',   endpoint, body, opts); },
  put(endpoint, body, opts)  { return this._request('PUT',    endpoint, body, opts); },
  del(endpoint, opts)        { return this._request('DELETE', endpoint, null, opts); }
};
