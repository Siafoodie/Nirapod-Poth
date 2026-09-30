const dummyCheckinData = {
  success: true,
  message: "Check-in successful",
  data: {
    status: "safe",
    timestamp: new Date().toISOString(),
  },
};

export const submitCheckin = async (checkinData) => {
  try {
    console.log("Check-in request:", checkinData);

    // Dummy API response
    return Promise.resolve({
      ...dummyCheckinData,
      data: {
        ...dummyCheckinData.data,
        ...checkinData,
      },
    });
  } catch (error) {
    console.error("Check-in service error:", error);
    throw error;
  }
};