const API_URL = "http://localhost:1337/api/auth/local";

export const registerUser = async (username, email, password) => {
    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
    });

    return response.json();
};

export const loginUser = async (email, password) => {
    try {
        const response = await fetch("http://localhost:1337/api/auth/local", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: email, password }),
        });

        const data = await response.json();
        if (data.jwt) {
            localStorage.setItem("token", data.jwt); // Store JWT
            localStorage.setItem("userId", data.user.id); // Store User ID
            console.log("Login successful:", data);
        } else {
            console.error("Login failed:", data);
        }
    } catch (error) {
        console.error("Error logging in:", error);
    }
};
