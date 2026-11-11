"use client";

import { EntityCrud } from "@/components/entity-crud";
import { orderEntity } from "@/lib/entities";

export default function OrdersPage() {
  return <EntityCrud config={orderEntity} />;
}
