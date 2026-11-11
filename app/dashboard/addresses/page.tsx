"use client";

import { EntityCrud } from "@/components/entity-crud";
import { addressEntity } from "@/lib/entities";

export default function AddressesPage() {
  return <EntityCrud config={addressEntity} />;
}
