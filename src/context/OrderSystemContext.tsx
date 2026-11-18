import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, set } from "firebase/database";
import { ORDER_SYSTEM_ENABLED } from "../config/orderSystem";

interface OrderSystemContextType {
  orderSystemActive: boolean;
  loading: boolean;
  setOrderSystemActive: (active: boolean) => Promise<void>;
  toggleOrderSystem: () => Promise<void>;
}

const OrderSystemContext = createContext<OrderSystemContextType>({
  orderSystemActive: false,
  loading: true,
  setOrderSystemActive: async () => {},
  toggleOrderSystem: async () => {},
});

export const OrderSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orderSystemActive, setOrderSystemActiveState] = useState<boolean>(ORDER_SYSTEM_ENABLED);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const orderSystemRef = ref(db, "settings/orderSystem");
    const unsubscribe = onValue(
      orderSystemRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          setOrderSystemActiveState(ORDER_SYSTEM_ENABLED && Boolean(val));
        } else {
          // Default to true if not set in DB
          setOrderSystemActiveState(ORDER_SYSTEM_ENABLED);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching order system status:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const setOrderSystemActive = async (active: boolean) => {
    if (!ORDER_SYSTEM_ENABLED) return;
    try {
      await set(ref(db, "settings/orderSystem"), active);
    } catch (err) {
      console.error("Failed to update order system status:", err);
      throw err;
    }
  };

  const toggleOrderSystem = async () => {
    if (!ORDER_SYSTEM_ENABLED) return;
    await setOrderSystemActive(!orderSystemActive);
  };

  return (
    <OrderSystemContext.Provider
      value={{
        orderSystemActive,
        loading,
        setOrderSystemActive,
        toggleOrderSystem,
      }}
    >
      {children}
    </OrderSystemContext.Provider>
  );
};

export const useOrderSystem = () => useContext(OrderSystemContext);
