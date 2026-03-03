const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

// ✅ Session must be mounted BEFORE any middleware that uses req.session
app.use(session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }));

// ✅ Single auth middleware (remove duplicates)
app.use("/customer/auth/*", function auth(req, res, next) {
  const token = req.session.authorization?.accessToken;

  if (!token) {
    return res.status(403).json({ message: "User not logged in" });
  }

  jwt.verify(token, "fingerprint_customer", (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
});

const PORT = 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running"));