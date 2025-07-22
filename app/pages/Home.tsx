import React from "react";
import StarterComponent from "../components/StarterComponent";

const Home = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to the Incubation Hub!</h1>
      <p className="mt-2 text-gray-600">This is your Home page. Start building your modules here.</p>
      <div className="mt-6">
        <StarterComponent text="This is a reusable component!" />
      </div>
    </div>
  );
};

export default Home;
