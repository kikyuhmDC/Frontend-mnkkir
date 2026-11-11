"use client";

import { EntityCrud } from "@/components/entity-crud";
import { categoryEntity } from "@/lib/entities";

export default function CategoriesPage() {
  return <EntityCrud config={categoryEntity} />;
}
