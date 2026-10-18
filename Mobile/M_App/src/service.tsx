import axios from 'axios';

const api = axios.create({
  baseURL: 'http://172.20.10.2:3000/api',
});

export default api