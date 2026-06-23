import React, { createContext, useContext, useState } from 'react';

const UnreadContext = createContext<{ total: number; setTotal: (n: number) => void }>({
  total: 0,
  setTotal: () => {},
});

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [total, setTotal] = useState(0);
  return <UnreadContext.Provider value={{ total, setTotal }}>{children}</UnreadContext.Provider>;
}

export const useUnread = () => useContext(UnreadContext);
