"use client";

import { EntityCrud } from "@/components/entity-crud";
import { productEntity } from "@/lib/entities";

export default function ProductsPage() {
  return <EntityCrud config={productEntity} />;
}
