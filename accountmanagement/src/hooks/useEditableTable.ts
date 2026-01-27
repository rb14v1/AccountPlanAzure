// accountmanagement/src/hooks/useEditableTable.ts
import { useState } from "react";

export function useEditableTable<T>(initialData: T) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftData, setDraftData] = useState<T>(initialData);

  const startEdit = () => {
    setDraftData(initialData);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraftData(initialData);
    setIsEditing(false);
  };

  const saveEdit = (onSave: (data: T) => void) => {
    onSave(draftData);
    setIsEditing(false);
  };

  const updateField = (
    key: keyof T,
    value: any
  ) => {
    setDraftData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const updateDraft = (newData: T) => {
  setDraftData(newData);
};

  return {
    isEditing,
    draftData,
    startEdit,
    cancelEdit,
    saveEdit,
    updateField,
    updateDraft,
  };
}
