import { useEffect, useState } from "react";
import { getBrandDetails } from "../services/api/brand.api";

export const useBrand = () => {
  const [brand, setBrand] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const fetchBrand = async () => {
    try {
      setLoading(true);

      const res = await getBrandDetails();

      setBrand(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrand();
  }, []);

  return {
    brand,
    loading,
    error,
    refetch: fetchBrand,
  };
};