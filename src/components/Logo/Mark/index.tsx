import React from "react";

const SeedleMark = ({ theme }: any) => {
  const color = theme === "dark" ? "#fff" : "#000";
  return (
    <div className="hidden md:block">
       <svg
    fill="none"
    height="21"
    viewBox="0 0 160 21"
    width="160"
    xmlns="http://www.w3.org/2000/svg"
    color={color}
  >
    <text
      x="0"
      y="16"
      fill="currentColor"
      fontFamily="Ubuntu, Roboto, sans-serif"
      fontSize="18"
      fontWeight="700"
    >
      BITS | finance
    </text>
  </svg>
    </div>
  );
};

export default SeedleMark;
