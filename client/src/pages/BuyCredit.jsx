import React, { useContext } from "react";
import { plans, assets } from "../assets/assets";
import { AppContext } from "../context/Appcontext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BuyCredit = () => {
  const { user, backendUrl, token, loadCreditsData, setShowLogin } =
    useContext(AppContext);
  const navigate = useNavigate();

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      handler: async (response) => {
        await axios.post(backendUrl + "/api/user/verify", response, {
          headers: { token },
        });
        loadCreditsData();
        navigate("/");
      },
    };
    new window.Razorpay(options).open();
  };

  const paymentRazorPay = async (planId) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    const { data } = await axios.post(
      backendUrl + "/api/user/pay",
      { planId },
      { headers: { token } }
    );
    if (data.success) initPay(data.order);
  };

  return (
    <div>
      {plans.map((item) => (
        <button key={item.id} onClick={() => paymentRazorPay(item.id)}>
          Buy {item.id}
        </button>
      ))}
    </div>
  );
};

export default BuyCredit;