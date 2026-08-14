// src/hooks/voucher/useVoucherForm.js
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchVoucherById,
  createDiscountVoucher,
  updateDiscountVoucher,
} from "../../services/voucher/VoucherService";

const EMPTY_FORM = {
  voucherName: "",
  startDate: "",
  startTime: "01:30 AM",
  endDate: "",
  endTime: "12:10 PM",
  shortTitle: "",
  valueOfAmount: "",
  percentageOfDiscount: "",
  singleUsePerUser: false,
  multipleUseUntilExpiry: true,
  applicableOutlets: {
    selectedBrandOutletCount: 0,
    totalOutletsCount: 0,
    subBrandCount: 0,
    franchiseCount: 0,
  },
  searchTags: [],
  whoCanUse: "android_ios_membership",
  whoCanClaim: "all_users",
};

function voucherToForm(voucher) {
  if (!voucher) return EMPTY_FORM;
  return {
    voucherName: voucher.title || "",
    startDate: voucher.startDate || "",
    startTime: voucher.startTime || "01:30 AM",
    endDate: voucher.endDate || "",
    endTime: voucher.endTime || "12:10 PM",
    shortTitle: voucher.shortTitle || "",
    valueOfAmount: voucher.valueOfAmount ?? "",
    percentageOfDiscount: voucher.percentageOfDiscount ?? "",
    singleUsePerUser: Boolean(voucher.singleUsePerUser),
    multipleUseUntilExpiry: voucher.multipleUseUntilExpiry ?? true,
    applicableOutlets: voucher.applicableOutlets || EMPTY_FORM.applicableOutlets,
    searchTags: voucher.searchTags || [],
    whoCanUse: voucher.whoCanUse || "android_ios_membership",
    whoCanClaim: voucher.whoCanClaim || "all_users",
  };
}

function formToPayload(form) {
  return {
    title: form.voucherName,
    startDate: form.startDate,
    startTime: form.startTime,
    endDate: form.endDate,
    endTime: form.endTime,
    publishedDate: form.startDate,
    expiredDate: form.endDate,
    shortTitle: form.shortTitle,
    valueOfAmount: Number(form.valueOfAmount) || 0,
    percentageOfDiscount: Number(form.percentageOfDiscount) || 0,
    discount: `${Number(form.percentageOfDiscount) || 0} %`,
    singleUsePerUser: form.singleUsePerUser,
    multipleUseUntilExpiry: form.multipleUseUntilExpiry,
    applicableOutlets: form.applicableOutlets,
    searchTags: form.searchTags,
    whoCanUse: form.whoCanUse,
    whoCanClaim: form.whoCanClaim,
  };
}

export default function useVoucherForm(voucherId) {
  const navigate = useNavigate();
  const isEditMode = Boolean(voucherId);

  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEditMode) return;
    setIsLoading(true);
    fetchVoucherById(voucherId)
      .then((voucher) => setForm(voucherToForm(voucher)))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [voucherId, isEditMode]);

  const setField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setOutletField = useCallback((field, value) => {
    setForm((prev) => ({
      ...prev,
      applicableOutlets: { ...prev.applicableOutlets, [field]: value },
    }));
  }, []);

  const addTag = useCallback(() => {
    const value = tagInput.trim();
    if (!value) return;
    setForm((prev) =>
      prev.searchTags.includes(value)
        ? prev
        : { ...prev, searchTags: [...prev.searchTags, value] }
    );
    setTagInput("");
  }, [tagInput]);

  const removeTag = useCallback((tag) => {
    setForm((prev) => ({
      ...prev,
      searchTags: prev.searchTags.filter((t) => t !== tag),
    }));
  }, []);

  const handleTagKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag();
      }
    },
    [addTag]
  );

  const submit = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setIsSubmitting(true);
      setError(null);
      try {
        const payload = formToPayload(form);
        const saved = isEditMode
          ? await updateDiscountVoucher(voucherId, payload)
          : await createDiscountVoucher(payload);
        navigate(`/vouchers/${saved.id}`);
        return saved;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, isEditMode, voucherId, navigate]
  );

  return {
    form,
    setField,
    setOutletField,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleTagKeyDown,
    isEditMode,
    isLoading,
    isSubmitting,
    error,
    submit,
  };
}