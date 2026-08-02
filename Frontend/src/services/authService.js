// API service for authentication endpoints
import api from "./api";


export const loginUser = (data) => {

    return api.post(
        "/login",
        data
    );

};


export const logoutUser = () => {

    return api.post(
        "/logout"
    );

};