import Plan from "../models/Plan.js";

// GET ALL PLANS
export const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });

    res.json({
      success: true,
      data: plans,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch plans",
    });
  }
};