import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorHandler } from "../utils/errorHandler";
import { ButtonLoader, Spinner } from "../components/loading";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 pr-10 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 placeholder-blue-400 bg-blue-50"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.29 3.29L3 3m0 0l18 18m-8.61-8.61a3 3 0 11-4.243-4.243m4.242 4.242L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
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