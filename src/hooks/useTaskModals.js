import { useState } from 'react';

function isDomOrReactEvent(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (typeof value.preventDefault === 'function' ||
        value.nativeEvent ||
        (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) ||
        (typeof Event !== 'undefined' && value instanceof Event))
  );
}

function asTaskData(value) {
  if (!value || typeof value !== 'object' || isDomOrReactEvent(value)) return null;
  return value;
}

export function useTaskModals() {
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const openView = (task) => {
    const data = asTaskData(task);
    if (!data) return;
    setSelectedTask(data);
    setViewModalOpen(true);
  };
  const openEdit = (task) => {
    const data = asTaskData(task);
    if (!data) return;
    setSelectedTask(data);
    setViewModalOpen(false);
    setModalOpen(true);
  };
  const openNew = (defaults = null) => {
    setSelectedTask(asTaskData(defaults));
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
