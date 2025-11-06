// insurance-frontend/jest.config.js

module.exports = {
  // Use the current directory as the root. This is the most critical fix.
  rootDir: '.', 
  
  // Explicitly tell Jest where to find the test files
  roots: [
    "<rootDir>/src"
  ],
  
  // This is usually handled by react-scripts, but ensure it's set if necessary
  testMatch: [
    "<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}"
  ],
  
  // Keep using the setup provided by react-scripts
  preset: 'react-scripts', 
};