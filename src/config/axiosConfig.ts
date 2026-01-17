import axios from "axios";
import Cookies from "js-cookie";
import { baseURL } from "../helpers/baseURL";

export const setupAxiosInterceptors = () => {
  axios.interceptors.request.use((request) => {
    const token = Cookies.get("token");
    request.baseURL = baseURL;
    // @ts-ignores
    request.headers = {
      "content-type": "application/json",
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
    request.withCredentials = true;
    return request;
  });
};