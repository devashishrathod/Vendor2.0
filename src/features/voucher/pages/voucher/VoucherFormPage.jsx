// src/pages/voucher/VoucherFormPage.jsx
import React from "react";
import { useParams } from "react-router-dom";
import useVoucherForm from "../../hooks/voucher/useVoucherForm";
import { VoucherForm } from "../../components/voucher";

export default function VoucherFormPage() {
  const { voucherId } = useParams();
  const {
    form,
    setField,
    setOutletField,
    setSelectedOutlets,
    addOffer,
    removeOffer,
    setOfferField,
    addImages,
    removeImage,
    removeExistingImage,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleTagKeyDown,
    isEditMode,
    isLoading,
    isSubmitting,
    uploadProgress,
    error,
    clearError,
    successMessage,
    clearSuccessMessage,
    submit,
  } = useVoucherForm(voucherId);

  if (isLoading) {
    return <p className="px-4 py-10 text-center text-gray-400">Loading voucher…</p>;
  }

  return (
    <VoucherForm
      mode={isEditMode ? "edit" : "add"}
      form={form}
      setField={setField}
      setOutletField={setOutletField}
      setSelectedOutlets={setSelectedOutlets}
      addOffer={addOffer}
      removeOffer={removeOffer}
      setOfferField={setOfferField}
      addImages={addImages}
      removeImage={removeImage}
      removeExistingImage={removeExistingImage}
      tagInput={tagInput}
      setTagInput={setTagInput}
      addTag={addTag}
      removeTag={removeTag}
      handleTagKeyDown={handleTagKeyDown}
      isSubmitting={isSubmitting}
      uploadProgress={uploadProgress}
      error={error}
      clearError={clearError}
      successMessage={successMessage}
      clearSuccessMessage={clearSuccessMessage}
      onSubmit={submit}
    />
  );
}