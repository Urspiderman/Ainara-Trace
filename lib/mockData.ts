export type Supplier = {
  id: string;
  name: string;
  type: string;
  status: "Verified" | "Pending" | "Review";
  lastTransaction: string;
};

export type GoldBatch = {
  id: string;
  supplier: string;
  weight: number;
  purity: string;
  status: "Traceable" | "Under Review" | "Verified";
  updatedAt: string;
  source: string;
};

export const suppliers: Supplier[] = [
  { id: "SUP-001", name: "Aurora Gold Collectors", type: "Collector", status: "Verified", lastTransaction: "05 Sep 2026" },
  { id: "SUP-002", name: "Nusantara Recycle Metals", type: "Recycler", status: "Verified", lastTransaction: "04 Sep 2026" },
  { id: "SUP-003", name: "Cendana Refinery", type: "Refiner", status: "Pending", lastTransaction: "03 Sep 2026" },
  { id: "SUP-004", name: "Mutiara Gold Store", type: "Gold Retailer", status: "Review", lastTransaction: "02 Sep 2026" },
];

export const batches: GoldBatch[] = [
  { id: "AIN-2026-00125", supplier: "Nusantara Recycle Metals", weight: 125.4, purity: "99.5%", status: "Traceable", updatedAt: "05 Sep 2026", source: "Recycled gold" },
  { id: "AIN-2026-00124", supplier: "Aurora Gold Collectors", weight: 82.7, purity: "99.0%", status: "Verified", updatedAt: "05 Sep 2026", source: "Recycled gold" },
  { id: "AIN-2026-00123", supplier: "Mutiara Gold Store", weight: 46.2, purity: "98.5%", status: "Under Review", updatedAt: "04 Sep 2026", source: "Scrap gold" },
  { id: "AIN-2026-00122", supplier: "Cendana Refinery", weight: 210.0, purity: "99.9%", status: "Traceable", updatedAt: "03 Sep 2026", source: "Refined material" },
];
