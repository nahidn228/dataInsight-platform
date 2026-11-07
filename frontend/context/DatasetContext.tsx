"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DatasetMetadata, FilterCondition } from "@/types";
import { DatasetApi } from "@/lib/api";

interface DatasetContextType {
  metadata: DatasetMetadata | null;
  datasetId: string | null;
  isLoading: boolean;
  activeFilters: FilterCondition[];
  setMetadata: (meta: DatasetMetadata | null) => void;
  setDatasetId: (id: string | null) => void;
  addFilter: (filter: FilterCondition) => void;
  removeFilter: (column: string) => void;
  clearFilters: () => void;
  refreshMetadata: () => Promise<void>;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const [metadata, setMetadata] = useState<DatasetMetadata | null>(null);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);

  // Load datasetId from localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem("datainsight_active_dataset_id");
    if (savedId && !datasetId) {
      setDatasetId(savedId);
      setIsLoading(true);
      DatasetApi.getMetadata(savedId)
        .then((data) => setMetadata(data))
        .catch(() => {
          localStorage.removeItem("datainsight_active_dataset_id");
          setDatasetId(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const handleSetDatasetId = (id: string | null) => {
    setDatasetId(id);
    if (id) {
      localStorage.setItem("datainsight_active_dataset_id", id);
    } else {
      localStorage.removeItem("datainsight_active_dataset_id");
      setMetadata(null);
      setActiveFilters([]);
    }
  };

  const refreshMetadata = async () => {
    if (!datasetId) return;
    try {
      const data = await DatasetApi.getMetadata(datasetId);
      setMetadata(data);
    } catch (e) {
      console.error(e);
    }
  };

  const addFilter = (filter: FilterCondition) => {
    setActiveFilters((prev) => [...prev.filter((f) => f.column !== filter.column), filter]);
  };

  const removeFilter = (column: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.column !== column));
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  return (
    <DatasetContext.Provider
      value={{
        metadata,
        datasetId,
        isLoading,
        activeFilters,
        setMetadata,
        setDatasetId: handleSetDatasetId,
        addFilter,
        removeFilter,
        clearFilters,
        refreshMetadata,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error("useDataset must be used within a DatasetProvider");
  }
  return context;
}
