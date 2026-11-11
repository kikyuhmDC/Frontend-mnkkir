"use client";

import { EntityCrud } from "@/components/entity-crud";
import { paymentEntity } from "@/lib/entities";

export default function PaymentsPage() {
  return <EntityCrud config={paymentEntity} />;
}
