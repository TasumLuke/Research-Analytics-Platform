// when people go to a page that doesn't exist
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const loc = useLocation();

  // just log it so we know
  useEffect(() => {
    console.error("404 - tried to go to:", loc.pathname);
  }, [loc.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-gray-600">Page not found bro</p>
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          Go back home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
