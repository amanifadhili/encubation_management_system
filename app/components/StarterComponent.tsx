import React from "react";

const StarterComponent = ({ text }: { text: string }) => (
  <div className="p-4 bg-blue-100 rounded">
    <span className="text-blue-700 font-semibold">{text}</span>
  </div>
);

export default StarterComponent; 