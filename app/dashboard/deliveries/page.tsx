"use client";

import { EntityCrud } from "@/components/entity-crud";
import { deliveryEntity } from "@/lib/entities";

export default function DeliveriesPage() {
  return <EntityCrud config={deliveryEntity} />;
}
