import React from "react";

export default function DevtoolsPlaceholder() {
  // Return an empty JSON response to satisfy Chrome devtools probe without errors
  return (
    <pre className="text-sm text-gray-600">
      {JSON.stringify({}, null, 2)}
    </pre>
  );
}


