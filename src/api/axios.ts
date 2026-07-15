import axios from 'axios';


const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL !== undefined 
    ? process.env.REACT_APP_API_URL 
    : (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001'),
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;