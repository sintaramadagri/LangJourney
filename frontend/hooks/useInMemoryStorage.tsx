"use client";

import { useMemo } from "react";
import {
  GenericStringInMemoryStorage,
  GenericStringStorage,
} from "@/fhevm/GenericStringStorage";

export function useInMemoryStorage(): {
  storage: GenericStringStorage;
} {
  const storage = useMemo(() => new GenericStringInMemoryStorage(), []);
  return { storage };
}



