import { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalEventId, setModalEventId] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportEventId, setReportEventId] = useState(null);

  const openReportModal = (eventId) => {
    setReportEventId(eventId);
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportEventId(null);
  };

  return (
    <ModalContext.Provider value={{ 
      modalEventId, 
      setModalEventId,
      reportModalOpen,
      reportEventId,
      openReportModal,
      closeReportModal
    }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}