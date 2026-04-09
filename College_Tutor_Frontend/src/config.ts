
/**
 * Dynamic configuration for the backend URL.
 * This automatically detects the current hostname (localhost or local IP)
 * so that friends on the same network can communicate with the server.
 */
const getBackendUrl = () => {
    // If we're on a mobile or another computer, the hostname will be your IP (e.g., 192.168.x.x)
    // If we're local, it will be 'localhost'.
    // We always want to point to port 5000 for the API.
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    return `${protocol}//${hostname}:5000`;
};

export const BACKEND_URL = getBackendUrl();
