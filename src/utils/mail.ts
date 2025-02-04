import axios from "axios";

const mail = axios.create({
  baseURL: "https://api.brevo.com/v3/",
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});


export default mail;
