const axios = require("axios");

const validateSession = async (req, res, next) => {
    try {
        const response = await axios.get("http://localhost:3001/session", {
            headers: { Cookie: req.headers.cookie },
        });

        if (!response.data.isValid) {
            return res.status(401).json({ message: "Unauthorized: Session expired or not found." });
        }

        req.user = response.data.user;
        next();
    } catch (error) {
        res.status(500).json({ error: "Session validation failed." });
    }
};

module.exports = validateSession;
