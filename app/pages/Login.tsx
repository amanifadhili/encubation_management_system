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
          <div className="text-blue-700 font-medium">
            Checking authentication...
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    if (user.password_status === "needs_change") {
      return <Navigate to="/force-password-change" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedIn = await login(email, password);
      if (loggedIn.password_status === "needs_change") {
        navigate("/force-password-change");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      // Use comprehensive error handler for all status codes
      const errorDetails = ErrorHandler.handleError(
        err,
        (msg) => setError(msg),
        "login"
      );

      // For login, 401 means invalid credentials
      if (errorDetails.status === 401) {
        setError("Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-4 py-8">
      {/* Modern login container with solid colors and sophisticated shadows */}
      <div className="relative bg-white rounded-2xl shadow-[0_32px_56px_-12px_rgba(0,0,0,0.06),0_6px_12px_-3px_rgba(0,0,0,0.02),0_3px_6px_-1.5px_rgba(0,0,0,0.01),0_0_0_0.75px_rgba(0,0,0,0.04)] p-6 sm:p-8 md:p-10 w-full max-w-md">
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-[0.02] pointer-events-none" 
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }} 
        />
        
        {/* Content with z-index */}
        <div className="relative z-10">
          {/* Logo/branding with solid color */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl sm:text-2xl font-bold">IH</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-700">Welcome Back</h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Sign in to continue</p>
          </div>
          
          {/* Form with responsive padding */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-sm sm:text-base">
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base shadow-sm hover:shadow-md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-sm sm:text-base">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-2.5 sm:py-3 pr-11 sm:pr-12 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base shadow-sm hover:shadow-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.29 3.29L3 3m0 0l18 18m-8.61-8.61a3 3 0 11-4.243-4.243m4.242 4.242L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path 
                    fillRule="evenodd" 
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}
            <ButtonLoader
              loading={loading}
              label="Sign In"
              loadingText="Signing in..."
              variant="primary"
              type="submit"
              fullWidth={true}
              className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              disabled={loading}
            />
          </form>
          <ButtonLoader
            loading={false}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate("/", { replace: true });
            }}
            label="Back Home"
            variant="secondary"
            type="button"
            fullWidth={true}
            className="mt-4 bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm hover:shadow transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
