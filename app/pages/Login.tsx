import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Mock authentication logic
    if (email === "user@example.com" && password === "password123") {
      navigate("/dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-blue-800 mb-1 font-semibold">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 placeholder-blue-400 bg-blue-50"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-blue-800 mb-1 font-semibold">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 placeholder-blue-400 bg-blue-50"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition">Login</button>
        </form>
        <button
          onClick={() => navigate("/")}
          className="mt-4 w-full bg-gray-200 text-blue-700 py-2 rounded font-semibold hover:bg-gray-300 transition"
        >
          Back Home
        </button>
      </div>
    </div>
  );
};

export default Login; 