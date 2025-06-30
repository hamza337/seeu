import { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalEventId, setModalEventId] = useState(null);
  return (
    <ModalContext.Provider value={{ modalEventId, setModalEventId }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
} 