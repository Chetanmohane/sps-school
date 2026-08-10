import axios from 'axios';


const getBaseUrl = () => {
  if (process.env.REACT_APP_API_URL !== undefined) {
    return process.env.REACT_APP_API_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:5000`;
};

const API = axios.create({
  baseURL: getBaseUrl(),
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;