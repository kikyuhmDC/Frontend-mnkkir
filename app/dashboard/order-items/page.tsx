"use client";

import { EntityCrud } from "@/components/entity-crud";
import { orderItemEntity } from "@/lib/entities";

export default function OrderItemsPage() {
  return <EntityCrud config={orderItemEntity} />;
}
