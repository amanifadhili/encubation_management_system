import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorHandler } from "../utils/errorHandler";
import { ButtonLoader, Spinner } from "../components/loading";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" color="blue" />
          <div className="text-blue-700 font-medium">Checking authentication...</div>
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      // Use comprehensive error handler for all status codes
      const errorDetails = ErrorHandler.handleError(err, (msg) => setError(msg), 'login');
      
      // For login, 401 means invalid credentials
      if (errorDetails.status === 401) {
        setError("Invalid email or password");
      }
    } finally {
      setLoading(false);
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
              disabled={loading}
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
              disabled={loading}
              required
              placeholder="Enter your password"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <ButtonLoader
            loading={loading}
            label="Sign In"
            loadingText="Signing in..."
            variant="primary"
            type="submit"
            fullWidth={true}
            className="bg-blue-700 hover:bg-blue-800"
            disabled={loading}
          />
        </form>
        <ButtonLoader
          loading={false}
          onClick={() => navigate("/")}
          label="Back Home"
          variant="secondary"
          type="button"
          fullWidth={true}
          className="mt-4 bg-gray-200 text-blue-700 hover:bg-gray-300"
        />
      </div>
    </div>
  );
};

export default Login; 