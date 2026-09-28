import React, { useState } from "react";

const ImSafeButton = () => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <button
        onClick={() => setShowPopup(true)}
        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
      >
        I'm Safe
      </button>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center w-80">
            <h2 className="text-xl font-bold mb-2">
              Safety Check-In
            </h2>

            <p className="text-gray-600 mb-4">
              Your safety status has been confirmed.
            </p>

            <button
              onClick={() => setShowPopup(false)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImSafeButton;