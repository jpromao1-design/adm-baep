import { useState } from 'react';

export function useTaskModals() {
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const openView = (task) => {
    setSelectedTask(task);
    setViewModalOpen(true);
  };
  const openEdit = (task) => {
    setSelectedTask(task);
    setViewModalOpen(false);
    setModalOpen(true);
  };
  const openNew = (defaults = null) => {
    setSelectedTask(defaults);
    setModalOpen(true);
  };
  const closeView = () => {
    setViewModalOpen(false);
    setSelectedTask(null);
  };
  const closeForm = () => {
    setModalOpen(false);
    setSelectedTask(null);
  };

  return {
    modalOpen,
    viewModalOpen,
    selectedTask,
    setModalOpen,
    openView,
    openEdit,
    openNew,
    closeView,
    closeForm,
  };
}
